import { supabase } from '../lib/supabase';
import type { Client } from './clientService';
import type { Supplier } from './supplierService';

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit_card' | 'other';
  current_balance: number;
  status: 'active' | 'inactive';
}

export interface FinancialTransaction {
  id: string;
  account_id: string | null;
  category_id: string | null;
  type: 'income' | 'expense';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  due_date: string;
  payment_date: string | null;
  description: string;
  notes: string | null;
  client_id: string | null;
  supplier_id: string | null;
  
  // Joins
  client?: Client;
  supplier?: Supplier;
}

export const financeService = {
  async getDashboardSummary(startDate: string, endDate: string) {
    // Para simplificar, pegaremos as transações no período e faremos as somas aqui.
    // Numa aplicação real muito grande, usaríamos RPC no Supabase.
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('type, status, amount')
      .gte('due_date', startDate)
      .lte('due_date', endDate);

    if (error) throw error;

    const summary = {
      income_pending: 0,
      income_paid: 0,
      expense_pending: 0,
      expense_paid: 0
    };

    data.forEach((t: any) => {
      if (t.type === 'income') {
        if (t.status === 'paid') summary.income_paid += Number(t.amount);
        else if (t.status !== 'cancelled') summary.income_pending += Number(t.amount);
      } else if (t.type === 'expense') {
        if (t.status === 'paid') summary.expense_paid += Number(t.amount);
        else if (t.status !== 'cancelled') summary.expense_pending += Number(t.amount);
      }
    });

    return summary;
  },

  async getTransactions(filterType?: 'income' | 'expense', status?: string, search?: string) {
    let query = supabase
      .from('financial_transactions')
      .select('*, client:clients(name), supplier:suppliers(name)')
      .order('due_date', { ascending: true });

    if (filterType) query = query.eq('type', filterType);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    let result = data as any[];
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(lower) || 
        t.client?.name?.toLowerCase().includes(lower) ||
        t.supplier?.name?.toLowerCase().includes(lower)
      );
    }

    return result;
  },

  async createTransaction(transaction: any) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .single();

      if (!profile?.company_id) throw new Error('Empresa não encontrada.');

      const cleanData = {
        ...transaction,
        company_id: profile.company_id,
        client_id: transaction.client_id || null,
        supplier_id: transaction.supplier_id || null,
        amount: Number(transaction.amount)
      };

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(cleanData)
        .select()
        .single();

      if (error) {
        console.error('Erro no Supabase:', error);
        throw new Error(`Erro no Banco: ${error.message}`);
      }
      return data;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Erro ao salvar transação.');
    }
  },

  async markAsPaid(id: string, accountId: string, paymentDate: string, options?: { penalty_amount?: number, interest_amount?: number, discount_amount?: number, expected_version?: number }) {
    try {
      // Concurrency check (Optimistic Locking) - bypass if version column is missing
      if (options?.expected_version !== undefined) {
        try {
          const { data: current, error: selectError } = await supabase
            .from('financial_transactions')
            .select('version')
            .eq('id', id)
            .single();
          
          if (!selectError && current && 'version' in current && current.version !== options.expected_version) {
            throw new Error('Erro de concorrência: O título foi modificado por outro usuário. Recarregue a página.');
          }
        } catch (e) {
          // If the 'version' column doesn't exist, we skip concurrency check
          console.warn('Skipping version check:', e);
        }
      }

      // Attempt full update including Phase 12 auditing/optimistic columns
      const { data, error } = await supabase
        .from('financial_transactions')
        .update({ 
          status: 'paid', 
          account_id: accountId, 
          payment_date: paymentDate,
          penalty_amount: options?.penalty_amount || 0,
          interest_amount: options?.interest_amount || 0,
          discount_amount: options?.discount_amount || 0,
          version: (options?.expected_version || 1) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        const errMsg = error.message || '';
        // If columns do not exist in schema cache, fallback to a basic update
        if (
          errMsg.includes('discount_amount') ||
          errMsg.includes('penalty_amount') ||
          errMsg.includes('interest_amount') ||
          errMsg.includes('version') ||
          error.code === '42703' ||
          error.code === 'PGRST204'
        ) {
          console.warn('Fallback to basic transaction update due to missing schema columns:', errMsg);
          const { data: fbData, error: fbError } = await supabase
            .from('financial_transactions')
            .update({
              status: 'paid',
              account_id: accountId,
              payment_date: paymentDate,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

          if (fbError) throw fbError;
          return fbData;
        }
        throw error;
      }
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao processar baixa do título.');
    }
  },
  
  async getAccounts() {
      const { data, error } = await supabase.from('financial_accounts').select('*').eq('status', 'active');
      if (error) throw error;
      return data as FinancialAccount[];
  },

  // ==========================================
  // MATHEMATICAL MODELS FOR CORPORATE CONTROLLER
  // ==========================================

  /**
   * Calculates Penalty and Interest for an overdue title.
   * @param principal Original title amount
   * @param dueDate Expected due date
   * @param paymentDate Actual payment date
   * @param penaltyRate Fixed penalty rate (e.g., 0.02 for 2%)
   * @param monthlyInterestRate Interest rate per month (e.g., 0.01 for 1%)
   */
  calculatePenaltyAndInterest(principal: number, dueDate: string, paymentDate: string, penaltyRate: number = 0.02, monthlyInterestRate: number = 0.01) {
    const due = new Date(dueDate);
    const payment = new Date(paymentDate);
    
    if (payment <= due) return { penalty: 0, interest: 0, delayDays: 0 };
    
    const delayDays = Math.ceil((payment.getTime() - due.getTime()) / (1000 * 3600 * 24));
    const penalty = principal * penaltyRate;
    const dailyInterestRate = monthlyInterestRate / 30;
    const interest = principal * dailyInterestRate * delayDays;
    
    return { penalty, interest, delayDays };
  },

  /**
   * Generates SAC Amortization Schedule (Sistema de Amortização Constante).
   * Fixed Amortization, Decreasing Interest.
   */
  generateSACAmortization(principal: number, installments: number, annualRate: number) {
    const monthlyRate = annualRate / 12;
    const fixedAmortization = principal / installments;
    let balance = principal;
    const schedule = [];

    for (let i = 1; i <= installments; i++) {
      const interest = balance * monthlyRate;
      const payment = fixedAmortization + interest;
      schedule.push({ installment: i, amortization: fixedAmortization, interest, payment, remaining_balance: balance - fixedAmortization });
      balance -= fixedAmortization;
    }
    return schedule;
  },

  /**
   * Generates PRICE Amortization Schedule (Tabela Price / French System).
   * Fixed Payment, Increasing Amortization.
   */
  generatePriceAmortization(principal: number, installments: number, annualRate: number) {
    const monthlyRate = annualRate / 12;
    const pmt = principal * ((monthlyRate * Math.pow(1 + monthlyRate, installments)) / (Math.pow(1 + monthlyRate, installments) - 1));
    let balance = principal;
    const schedule = [];

    for (let i = 1; i <= installments; i++) {
      const interest = balance * monthlyRate;
      const amortization = pmt - interest;
      schedule.push({ installment: i, amortization, interest, payment: pmt, remaining_balance: balance - amortization });
      balance -= amortization;
    }
    return schedule;
  },

  /**
   * Calculates Monthly Linear Depreciation for Fixed Assets.
   */
  calculateMonthlyDepreciation(purchaseValue: number, residualValue: number, usefulLifeMonths: number) {
    if (usefulLifeMonths <= 0) return 0;
    const depreciableBase = purchaseValue - residualValue;
    return depreciableBase / usefulLifeMonths;
  },

  /**
   * Generates Withholding Taxes payload to split a service payment into government tax titles.
   */
  generateWithholdingTaxes(baseAmount: number, rates = { iss: 0.05, irrf: 0.015, csr: 0.0465 }) {
    const iss = baseAmount * rates.iss;
    const irrf = baseAmount * rates.irrf;
    const csr = baseAmount * rates.csr;
    const totalTaxes = iss + irrf + csr;
    const netToSupplier = baseAmount - totalTaxes;

    return {
      netToSupplier,
      taxes: { iss, irrf, csr, total: totalTaxes }
    };
  }
};
