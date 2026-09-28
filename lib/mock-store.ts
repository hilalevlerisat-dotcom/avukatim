import type { Client, Case, FinanceType, PaymentMethod, CaseCategory, CaseStatus, ClientType, Document } from './database.types'

export type StoreClient = {
  id: string
  full_name: string
  client_type: ClientType
  phone: string | null
  email: string | null
  address: string | null
  tc_no: string | null
  company_name: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type StoreCase = {
  id: string
  client_id: string
  client_name?: string
  title: string
  category: CaseCategory
  status: CaseStatus
  case_number: string
  court_name: string
  open_date: string
  description?: string
}

export type InstallmentItem = {
  id: string
  installment_number: number
  due_date: string // YYYY-MM-DD
  amount: number
  is_paid: boolean
  paid_date?: string | null
  description?: string
}

export type StoreFinance = {
  id: string
  client_id: string
  client_name: string
  case_id?: string | null
  case_title?: string | null
  finance_type: FinanceType
  amount: number
  transaction_date: string
  due_date?: string | null
  description: string
  payment_method?: PaymentMethod | null
  // Taksitlendirme alanları
  has_installments?: boolean
  installment_count?: number
  installments?: InstallmentItem[]
  is_collected?: boolean
}

export type CollectionItem = {
  id: string
  finance_id: string
  installment_id?: string
  client_id: string
  client_name: string
  case_id?: string | null
  case_title?: string | null
  due_date: string // YYYY-MM-DD
  amount: number
  description: string
  installment_number?: number
  total_installments?: number
  is_paid: boolean
  paid_date?: string | null
}

// Üretim ortamı: demo verisi yok — sistem tamamen boş başlar
const DEFAULT_CLIENTS: StoreClient[] = []
const DEFAULT_CASES: StoreCase[] = []
const DEFAULT_FINANCES: StoreFinance[] = []

const STORE_CLEAN_VERSION_KEY = 'avukatim_store_clean_version'
const CURRENT_CLEAN_VERSION = 'v2026_clean_prod_v1'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function notifyStoreChange() {
  if (isBrowser()) {
    window.dispatchEvent(new Event('avukatim-store-update'))
  }
}

export function wipeAllDemoData() {
  if (!isBrowser()) return
  try {
    localStorage.setItem('avukatim_clients', '[]')
    localStorage.setItem('avukatim_cases', '[]')
    localStorage.setItem('avukatim_finances', '[]')
    localStorage.setItem('avukatim_documents', '[]')
    localStorage.setItem('avukatim_reminders', '[]')
    localStorage.setItem('avukatim_hearings', '[]')
    localStorage.setItem('avukatim_deadlines', '[]')
    localStorage.setItem(STORE_CLEAN_VERSION_KEY, CURRENT_CLEAN_VERSION)
    notifyStoreChange()
  } catch (e) {
    console.error('Error wiping demo data:', e)
  }
}

export function checkAndCleanStore() {
  if (!isBrowser()) return
  try {
    const v = localStorage.getItem(STORE_CLEAN_VERSION_KEY)
    const rawClients = localStorage.getItem('avukatim_clients') || ''
    const rawFinances = localStorage.getItem('avukatim_finances') || ''
    const rawCases = localStorage.getItem('avukatim_cases') || ''
    const hasDemo = rawClients.includes('Ahmet Aslan') || 
                    rawClients.includes('Kaya İnşaat') || 
                    rawFinances.includes('Ahmet Aslan') || 
                    rawFinances.includes('Kaya İnşaat') ||
                    rawCases.includes('Ahmet Aslan') ||
                    rawCases.includes('Kaya İnşaat')

    if (v !== CURRENT_CLEAN_VERSION || hasDemo) {
      wipeAllDemoData()
    }
  } catch (e) {
    console.error('Error checking store:', e)
  }
}

// Auto-run when module is loaded in browser
if (typeof window !== 'undefined') {
  checkAndCleanStore()
}

// ── CLIENTS ──────────────────────────────────────────────────────────
export function getStoredClients(): StoreClient[] {
  if (!isBrowser()) return DEFAULT_CLIENTS
  checkAndCleanStore()
  try {
    const raw = localStorage.getItem('avukatim_clients')
    if (!raw) {
      localStorage.setItem('avukatim_clients', JSON.stringify(DEFAULT_CLIENTS))
      return DEFAULT_CLIENTS
    }
    return JSON.parse(raw)
  } catch {
    return DEFAULT_CLIENTS
  }
}

export function saveStoredClients(clients: StoreClient[]) {
  if (!isBrowser()) return
  try {
    localStorage.setItem('avukatim_clients', JSON.stringify(clients))
    notifyStoreChange()
  } catch (e) {
    console.error('Error saving clients', e)
  }
}

export function getClientById(id: string): StoreClient {
  const clients = getStoredClients()
  const found = clients.find(c => c.id === id)
  if (found) return found

  // Fallback gracefully for IDs not yet in store
  const fallback: StoreClient = {
    id,
    full_name: 'Müvekkil',
    client_type: 'individual',
    phone: '',
    email: '',
    address: '',
    tc_no: '',
    company_name: '',
    notes: '',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  return fallback
}

export function updateClientInStore(id: string, updates: Partial<StoreClient>): StoreClient {
  const clients = getStoredClients()
  const idx = clients.findIndex(c => c.id === id)
  let updatedClient: StoreClient

  if (idx >= 0) {
    updatedClient = { ...clients[idx], ...updates, updated_at: new Date().toISOString() }
    clients[idx] = updatedClient
    saveStoredClients(clients)
  } else {
    // create and add
    updatedClient = {
      id,
      full_name: updates.full_name || 'Müvekkil',
      client_type: updates.client_type || 'individual',
      phone: updates.phone || '',
      email: updates.email || '',
      address: updates.address || '',
      tc_no: updates.tc_no || '',
      company_name: updates.company_name || '',
      notes: updates.notes || '',
      is_active: updates.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...updates
    }
    saveStoredClients([updatedClient, ...clients])
  }
  return updatedClient
}

// ── CASES ────────────────────────────────────────────────────────────
export function getStoredCases(clientId?: string): StoreCase[] {
  let cases = DEFAULT_CASES
  if (isBrowser()) {
    checkAndCleanStore()
    try {
      const raw = localStorage.getItem('avukatim_cases')
      if (!raw) {
        localStorage.setItem('avukatim_cases', JSON.stringify(DEFAULT_CASES))
      } else {
        cases = JSON.parse(raw)
      }
    } catch {
      cases = DEFAULT_CASES
    }
  }
  if (clientId) {
    return cases.filter(c => c.client_id === clientId)
  }
  return cases
}

export function saveCaseToStore(caseItem: StoreCase) {
  if (!isBrowser()) return
  try {
    const cases = getStoredCases()
    const idx = cases.findIndex(c => c.id === caseItem.id)
    if (idx >= 0) {
      cases[idx] = caseItem
    } else {
      cases.unshift(caseItem)
    }
    localStorage.setItem('avukatim_cases', JSON.stringify(cases))
    notifyStoreChange()
  } catch (e) {
    console.error('Error saving case', e)
  }
}

// ── FINANCES ──────────────────────────────────────────────────────────
export function getStoredFinances(clientId?: string, caseId?: string): StoreFinance[] {
  let list = DEFAULT_FINANCES
  if (isBrowser()) {
    checkAndCleanStore()
    try {
      const raw = localStorage.getItem('avukatim_finances')
      if (!raw) {
        localStorage.setItem('avukatim_finances', JSON.stringify(DEFAULT_FINANCES))
      } else {
        list = JSON.parse(raw)
      }
    } catch {
      list = DEFAULT_FINANCES
    }
  }

  if (clientId) {
    list = list.filter(f => f.client_id === clientId)
  }
  if (caseId) {
    list = list.filter(f => f.case_id === caseId)
  }
  return list
}

export function saveFinanceToStore(record: StoreFinance): StoreFinance[] {
  if (!isBrowser()) return DEFAULT_FINANCES
  try {
    const list = getStoredFinances()
    const idx = list.findIndex(f => f.id === record.id)
    if (idx >= 0) {
      list[idx] = record
    } else {
      list.unshift(record)
    }
    localStorage.setItem('avukatim_finances', JSON.stringify(list))
    notifyStoreChange()
    return list
  } catch (e) {
    console.error('Error saving finance', e)
    return DEFAULT_FINANCES
  }
}

export function deleteFinanceFromStore(id: string): StoreFinance[] {
  if (!isBrowser()) return DEFAULT_FINANCES
  try {
    const list = getStoredFinances().filter(f => f.id !== id)
    localStorage.setItem('avukatim_finances', JSON.stringify(list))
    notifyStoreChange()
    return list
  } catch (e) {
    console.error('Error deleting finance', e)
    return DEFAULT_FINANCES
  }
}

/**
 * Directly sets or updates the agreed retainer (vekalet ücreti) for a client!
 * This guarantees the user has full control over the retainer amount.
 */
export function setClientRetainerFee(clientId: string, amount: number, description?: string): StoreFinance[] {
  if (!isBrowser()) return DEFAULT_FINANCES
  try {
    const all = getStoredFinances()
    const client = getClientById(clientId)
    const clientFinances = all.filter(f => f.client_id === clientId || (clientId === '1' && f.client_id === 'c1'))
    const existingRetainer = clientFinances.find(f => f.finance_type === 'retainer')

    if (existingRetainer) {
      existingRetainer.amount = Number(amount)
      if (description) existingRetainer.description = description
    } else {
      const newRec: StoreFinance = {
        id: crypto.randomUUID(),
        client_id: clientId,
        client_name: client.full_name,
        finance_type: 'retainer',
        amount: Number(amount),
        transaction_date: new Date().toISOString().split('T')[0],
        due_date: null,
        description: description || 'Anlaşılan Vekalet Ücreti',
        payment_method: 'bank_transfer',
      }
      all.unshift(newRec)
    }

    localStorage.setItem('avukatim_finances', JSON.stringify(all))
    notifyStoreChange()
    return all
  } catch (e) {
    console.error('Error setting retainer', e)
    return DEFAULT_FINANCES
  }
}

/**
 * Calculates finance metrics for a client or overall
 */
export function calculateFinanceSummary(finances: StoreFinance[]) {
  const totalRetainer = finances
    .filter(f => f.finance_type === 'retainer')
    .reduce((sum, f) => sum + f.amount, 0)

  // Toplam ödeme: Hem payment kayıtları hem de taksitlerden ödenenler
  let totalPaid = 0
  for (const f of finances) {
    if (f.finance_type === 'payment') {
      totalPaid += f.amount
    } else if (f.has_installments && f.installments && f.installments.length > 0) {
      const paidFromInstallments = f.installments
        .filter(i => i.is_paid)
        .reduce((sum, i) => sum + i.amount, 0)
      totalPaid += paidFromInstallments
    }
  }

  const totalExpense = finances
    .filter(f => ['expense', 'court_fee'].includes(f.finance_type))
    .reduce((sum, f) => sum + f.amount, 0)

  // Bakiye (Balance) = Ödenen - (Sözleşme + Giderler)
  // Negatif bakiye = Borç (Müvekkilin ödemesi gereken)
  // Pozitif bakiye = Alacaklı (Müvekkil fazla ödemiş)
  const balance = totalPaid - (totalRetainer + totalExpense)
  const remaining = Math.max(0, (totalRetainer + totalExpense) - totalPaid)
  const paidPct = (totalRetainer + totalExpense) > 0 ? Math.min(100, Math.round((totalPaid / (totalRetainer + totalExpense)) * 100)) : 0

  return { totalRetainer, totalPaid, totalExpense, remaining, paidPct, balance }
}

/**
 * Returns all collection schedules (installments and due dates) across all finances
 */
export function getAllCollectionSchedules(providedFinances?: StoreFinance[]): CollectionItem[] {
  const finances = providedFinances || getStoredFinances()
  const collections: CollectionItem[] = []

  for (const f of finances) {
    if (f.has_installments && f.installments && f.installments.length > 0) {
      for (const inst of f.installments) {
        collections.push({
          id: `${f.id}_${inst.id}`,
          finance_id: f.id,
          installment_id: inst.id,
          client_id: f.client_id,
          client_name: f.client_name,
          case_id: f.case_id,
          case_title: f.case_title,
          due_date: inst.due_date,
          amount: inst.amount,
          description: inst.description || `${inst.installment_number}. Taksit Tahsilatı`,
          installment_number: inst.installment_number,
          total_installments: f.installments.length,
          is_paid: !!inst.is_paid,
          paid_date: inst.paid_date,
        })
      }
    } else if (f.due_date && (f.finance_type === 'retainer' || f.finance_type === 'payment')) {
      collections.push({
        id: f.id,
        finance_id: f.id,
        client_id: f.client_id,
        client_name: f.client_name,
        case_id: f.case_id,
        case_title: f.case_title,
        due_date: f.due_date,
        amount: f.amount,
        description: f.description || 'Tahsilat Ödemesi',
        is_paid: !!f.is_collected,
      })
    }
  }

  return collections.sort((a, b) => a.due_date.localeCompare(b.due_date))
}

/**
 * Toggles or marks an installment or collection as paid
 */
export function markCollectionAsPaid(financeId: string, installmentId?: string, isPaid: boolean = true) {
  if (!isBrowser()) return
  const list = getStoredFinances()
  const finance = list.find(f => f.id === financeId)
  if (!finance) return

  if (installmentId && finance.installments) {
    const inst = finance.installments.find(i => i.id === installmentId)
    if (inst) {
      inst.is_paid = isPaid
      inst.paid_date = isPaid ? new Date().toISOString().split('T')[0] : null
    }
  } else {
    finance.is_collected = isPaid
  }

  localStorage.setItem('avukatim_finances', JSON.stringify(list))
  notifyStoreChange()
}


// Üretim ortamı: evrak demo verisi yok
const DEFAULT_DOCUMENTS: Document[] = []

export function getStoredDocuments(caseId?: string, clientId?: string): Document[] {
  let docs = DEFAULT_DOCUMENTS
  if (isBrowser()) {
    try {
      const raw = localStorage.getItem('avukatim_documents')
      if (!raw) {
        localStorage.setItem('avukatim_documents', JSON.stringify(DEFAULT_DOCUMENTS))
      } else {
        docs = JSON.parse(raw)
      }
    } catch {
      docs = DEFAULT_DOCUMENTS
    }
  }

  if (caseId) {
    return docs.filter(d => d.case_id === caseId)
  }
  if (clientId) {
    return docs.filter(d => d.client_id === clientId || (clientId === '1' && d.client_id === 'c1'))
  }
  return docs
}

export function saveDocumentToStore(doc: Document): Document[] {
  let docs = getStoredDocuments()
  const idx = docs.findIndex(d => d.id === doc.id)
  if (idx >= 0) {
    docs[idx] = doc
  } else {
    docs = [doc, ...docs]
  }

  if (isBrowser()) {
    try {
      localStorage.setItem('avukatim_documents', JSON.stringify(docs))
      notifyStoreChange()
    } catch (e) {
      console.error('Error saving document to store', e)
    }
  }
  return docs
}

export function deleteDocumentFromStore(id: string): Document[] {
  let docs = getStoredDocuments().filter(d => d.id !== id)
  if (isBrowser()) {
    try {
      localStorage.setItem('avukatim_documents', JSON.stringify(docs))
      notifyStoreChange()
    } catch (e) {
      console.error('Error deleting document', e)
    }
  }
  return docs
}
