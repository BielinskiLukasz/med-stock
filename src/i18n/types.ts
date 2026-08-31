// ─── Types ──────────────────────────────────────────────────────────────────

export type Lang = 'en' | 'pl'

export type TranslationDict = {
  nav: {
    medicines: string
    dashboard: string
    trash: string
    locations: string
    data: string
  }
  status: {
    active: string
    opened: string
    expired: string
    exceededOpenPeriod: string
    usedUp: string
    disposed: string
    archived: string
  }
  categories: {
    painFever: string
    antibiotics: string
    allergy: string
    digestive: string
    vitaminsSupplements: string
    skinTopical: string
    eyeEar: string
    coldFlu: string
    heartCirculation: string
    other: string
  }
  locationNames: {
    bathroomCabinet: string
    bedroomCabinet: string
    kitchenDrawer: string
    other: string
  }
  formTypes: {
    tablet: string
    capsule: string
    syrup: string
    cream: string
    drops: string
    spray: string
    powder: string
    gel: string
    ointment: string
    patch: string
    inhaler: string
    suppository: string
    other: string
  }
  units: {
    tablets: string
    capsules: string
    ml: string
    g: string
    pcs: string
    patches: string
    drops: string
    doses: string
    days: string
    weeks: string
    months: string
    box: string
    boxes: string
    units: string
    locations: string
  }
  dates: {
    noExpiry: string
    expires: string
    opened: string
  }
  medicines: {
    title: string
    searchPlaceholder: string
    addButton: string
    emptyHeading: string
    emptyBody: string
    noResultsHeading: string
    noResultsBody: string
    noStockHeading: string
    noStockBody: string
    loading: string
  }
  dashboard: {
    title: string
    expired: string
    expiringSoon: string
    exceededOpenPeriod: string
    total: string
    loading: string
  }
  trash: {
    title: string
    emptyBody: string
    view: string
    restore: string
    deletePermanently: string
    deleteConfirmTitle: string
    deleteConfirmBody: string
    cancel: string
    deleted: string
    unknown: string
  }
  locations: {
    title: string
  }
  data: {
    title: string
    exportSection: string
    importSection: string
    syncSection: string
    exportButton: string
    importJSONButton: string
    importCSVButton: string
  }
  history: {
    title: string
    noHistory: string
    added: string
    deleted: string
    restored: string
    updated: string
    fieldsUpdated: string
    fieldChanged: string
  }
  form: {
    name: string
    namePlaceholder: string
    nameRequired: string
    category: string
    noCategory: string
    formType: string
    noType: string
    quantity: string
    quantityUnit: string
    expiryDate: string
    openedDate: string
    pao: string
    paoUnit: string
    location: string
    noLocation: string
    addLocation: string
    newLocationPlaceholder: string
    addNewLocation: string
    notes: string
    notesPlaceholder: string
    packCount: string
    save: string
    saveChanges: string
    cancel: string
    addMedicine: string
    editMedicine: string
    editStock: string
    moveStock: string
    targetLocation: string
    openBox: string
    moveToTrash: string
    delete: string
    deleteConfirmTitle: string
    deleteConfirmBody: string
  }
  filter: {
    title: string
    sortBy: string
    byName: string
    byExpiry: string
    byStatus: string
    byCreated: string
    asc: string
    desc: string
    byStatusLabel: string
    byCategoryLabel: string
    byLocationLabel: string
    clearAll: string
    status: string
    category: string
    location: string
  }
  toasts: {
    saved: string
    updated: string
    deleted: string
    restored: string
    moved: string
    exported: string
    imported: string
    importPartial: string
    saveFailed: string
    deleteFailed: string
    moveFailed: string
    locationFailed: string
    exportFailed: string
    importFailed: string
    boxOpened: string
    catalogDeleted: string
  }
  common: {
    loading: string
    unknown: string
    acrossLocations: string
    across: string
    locations: string
  }
}

// ─── Lookup Records ──────────────────────────────────────────────────────────

/** Maps canonical category values (from CATEGORIES array) to TranslationDict dot-notation keys */
export const CATEGORY_KEYS: Record<string, string> = {
  'Pain & Fever': 'categories.painFever',
  'Antibiotics': 'categories.antibiotics',
  'Allergy': 'categories.allergy',
  'Digestive': 'categories.digestive',
  'Vitamins & Supplements': 'categories.vitaminsSupplements',
  'Skin & Topical': 'categories.skinTopical',
  'Eye & Ear': 'categories.eyeEar',
  'Cold & Flu': 'categories.coldFlu',
  'Heart & Circulation': 'categories.heartCirculation',
  'Other': 'categories.other',
}

/** Maps predefined DB location names to TranslationDict dot-notation keys */
export const LOCATION_KEYS: Record<string, string> = {
  'Bathroom Cabinet': 'locationNames.bathroomCabinet',
  'Bedroom Cabinet': 'locationNames.bedroomCabinet',
  'Kitchen Drawer': 'locationNames.kitchenDrawer',
}

/** Maps canonical quantity unit values (from QUANTITY_UNITS) to TranslationDict dot-notation keys */
export const UNIT_KEYS: Record<string, string> = {
  'tablets': 'units.tablets',
  'capsules': 'units.capsules',
  'ml': 'units.ml',
  'g': 'units.g',
  'pcs': 'units.pcs',
  'patches': 'units.patches',
  'drops': 'units.drops',
  'doses': 'units.doses',
  'units': 'units.units',
}

/** Maps MedicineForm canonical values to TranslationDict dot-notation keys */
export const FORM_TYPE_KEYS: Record<string, string> = {
  'Tablet': 'formTypes.tablet',
  'Capsule': 'formTypes.capsule',
  'Syrup': 'formTypes.syrup',
  'Cream': 'formTypes.cream',
  'Drops': 'formTypes.drops',
  'Spray': 'formTypes.spray',
  'Powder': 'formTypes.powder',
  'Gel': 'formTypes.gel',
  'Ointment': 'formTypes.ointment',
  'Patch': 'formTypes.patch',
  'Inhaler': 'formTypes.inhaler',
  'Suppository': 'formTypes.suppository',
  'Other': 'formTypes.other',
}
