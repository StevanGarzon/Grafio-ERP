# Feature Integration and Bug Fix Implementation Plan

## Goal Description

Implement the following user-requested enhancements and fixes in the application:
1. **Chart.js integration** on `RelatoriosPage` to replace existing mock charts with interactive, animated charts.
2. **Popup UI for "Receber" action** in the "Lançamentos" (financial transactions) page, using the app's design system and removing the "conta financeira" field.
3. **Fix schema cache error**: "Could not find the 'discount_amount' column of 'financial_transactions'" when confirming a receipt.
4. **Centro de custos functionality** – ensure cost center selection works and allows adding costs.
5. **ViaCEP API integration** for automatic address lookup in the client form.
6. **Documenso and OpenSign integration** to allow electronic signatures on contracts/documents.
7. **General UI polish** to align with premium design guidelines (dark mode, glassmorphism, micro‑animations).

## User Review Required

- **Chart.js visual design**: Confirm color palette and animation preferences.
- **Popup design**: Approve the proposed layout and removal of the "conta financeira" field.
- **Signature providers**: Choose between Documenso and OpenSign (or both) and provide API keys/URLs.
- **ViaCEP usage**: Confirm whether to store the fetched address data in the client record.

> [!IMPORTANT] The user must provide any required API keys (Documenso, OpenSign) and confirm design choices before we proceed.

## Open Questions

- Preferred color scheme for Chart.js (e.g., brand primary colors, dark mode support)?
- Should the "Receber" popup also display transaction details (date, amount) besides the input fields?
- What are the exact fields required for the cost‑center addition? Are there any validation rules?
- Do you want the ViaCEP request to be triggered on blur of the CEP field or on a button click?
- Are there any specific UI animations (e.g., fade‑in, slide‑up) desired for the new popup and charts?

## Proposed Changes

---
### Front‑end

#### [MODIFY] [RelatoriosPage.tsx](file:///c:/Users/Stevan/Documents/app/src/pages/RelatoriosPage.tsx)
- Remove mock bar and donut markup.
- Import `Chart` from `chart.js` and create two chart instances (`Bar` for monthly revenue, `Doughnut` for product mix).
- Add a `useEffect` hook to initialize charts on a `<canvas>` element.
- Apply responsive options and custom tooltip styling to match the app theme.

#### [NEW] [components/ChartWrapper.tsx](file:///c:/Users/Stevan/Documents/app/src/components/ChartWrapper.tsx)
- Reusable wrapper component handling canvas resizing and chart lifecycle.

#### [MODIFY] [RelatoriosPage.css](file:///c:/Users/Stevan/Documents/app/src/pages/RelatoriosPage.css)
- Add CSS variables for chart colors, micro‑animation transitions, and dark‑mode support.

#### [MODIFY] [LancamentosPage.tsx] (assumed file handling financial transactions)
- Add a state flag to open a modal when "Receber" button is clicked.
- Create a new modal component `ReceiveModal` using the existing design system (glassmorphism background, subtle shadow, animation).
- Remove the "conta financeira" input from the modal.
- Include fields: "Valor Recebido", "Data Recebimento", optional "Observação".

#### [NEW] [components/ReceiveModal.tsx]
- Implements the popup UI and emits a submit event.

#### [MODIFY] [services/transactionService.ts]
- Update the receipt API call to include the `discount_amount` handling or adjust the request to match the backend schema.
- Add error handling to fallback gracefully if the column is missing.

#### [MODIFY] [CostCenterForm.tsx] (or relevant component)
- Ensure the cost‑center dropdown populates correctly and allows adding a cost entry.

#### [MODIFY] [ClienteFormPage.tsx]
- Already added `handleCepChange`; ensure it debounces API calls and updates address fields.

#### [NEW] [services/viacepService.ts]
- Wrapper around the ViaCEP fetch with TypeScript typings.

#### [NEW] [services/signatureService.ts]
- Abstract API client for Documenso/OpenSign (methods: `requestSignature`, `verifyStatus`).

#### [MODIFY] [ContratosPage.tsx] & [DocumentosPage.tsx]
- Add "Assinar" button that opens a signature modal, uses `signatureService`.

---
### Back‑end (if needed)

#### [MODIFY] [src-tauri/src/api/financial_transactions.rs]
- Add `discount_amount` column handling or migrate schema.
- Ensure the request payload matches the new fields.

#### [MODIFY] [src-tauri/src/api/cost_center.rs]
- Verify endpoint for adding costs works and returns proper validation.

## Verification Plan

### Automated Tests
- Unit tests for `ChartWrapper` rendering with mock data.
- Integration test ensuring the "Receber" modal submits correctly and updates UI.
- End‑to‑end test for ViaCEP field auto‑fill.
- Mock API tests for Documenso/OpenSign request flow.

### Manual Verification
- Open `RelatoriosPage` and verify interactive charts render, resize, and display tooltips.
- Click "Receber" on a transaction; confirm popup appears with correct fields and no "conta financeira".
- Confirm that confirming receipt no longer throws the schema cache error.
- Test cost‑center selection and adding a cost.
- Enter a CEP and see address auto‑filled.
- Initiate a signature request and verify the external service is called and status updates.

---
**Once the user approves the plan and provides any required API keys, we will proceed with implementation.**
