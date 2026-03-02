"use client";

export const RENTAL_CONTRACTS_STORAGE_KEY = "vlu.rental.contracts";
export const RENTAL_CONTRACTS_EVENT = "vlu:rental-contracts:changed";

export type RentalContractStatus = "pending_tenant_signature" | "fully_signed";

export type RentalContractRecord = {
  id: string;
  landlordName: string;
  landlordEmail?: string;
  landlordId: string;
  landlordPhone: string;
  landlordAddress: string;
  tenantName: string;
  tenantEmail?: string;
  tenantUserId?: string;
  tenantId: string;
  tenantPhone: string;
  tenantAddress: string;
  propertyAddress: string;
  rent: string;
  deposit: string;
  termStart: string;
  termEnd: string;
  paymentDay: string;
  extraTerms: string;
  status?: RentalContractStatus;
  landlordSignatureName: string;
  landlordSignatureDataUrl?: string;
  landlordSignedAt?: string;
  tenantSignatureName?: string;
  tenantSignatureDataUrl?: string;
  tenantSignedAt?: string;
  sentAt?: string;
  createdAt: string;
  signedAt: string;
};

function isRentalContractRecord(value: unknown): value is RentalContractRecord {
  if (!value || typeof value !== "object") return false;

  const record = value as Partial<RentalContractRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.landlordName === "string" &&
    typeof record.tenantName === "string" &&
    typeof record.propertyAddress === "string" &&
    typeof record.rent === "string" &&
    typeof record.deposit === "string" &&
    typeof record.termStart === "string" &&
    typeof record.termEnd === "string" &&
    typeof record.paymentDay === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.signedAt === "string"
  );
}

export function readRentalContractsFromStorage() {
  if (typeof window === "undefined") return [] as RentalContractRecord[];

  try {
    const raw = window.localStorage.getItem(RENTAL_CONTRACTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isRentalContractRecord);
  } catch {
    return [];
  }
}

export function getRentalContractStatus(contract: RentalContractRecord): RentalContractStatus {
  if (contract.status === "pending_tenant_signature" || contract.status === "fully_signed") {
    return contract.status;
  }

  return contract.signedAt ? "fully_signed" : "pending_tenant_signature";
}

export function getRentalContractSortTimestamp(contract: RentalContractRecord) {
  return (
    contract.tenantSignedAt ||
    contract.signedAt ||
    contract.landlordSignedAt ||
    contract.sentAt ||
    contract.createdAt
  );
}

function writeRentalContractsToStorage(contracts: RentalContractRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RENTAL_CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
  window.dispatchEvent(new Event(RENTAL_CONTRACTS_EVENT));
}

export function upsertRentalContractToStorage(contract: RentalContractRecord) {
  const contracts = readRentalContractsFromStorage();
  const nextContracts = [contract, ...contracts.filter((item) => item.id !== contract.id)];
  writeRentalContractsToStorage(nextContracts);
  return nextContracts;
}
