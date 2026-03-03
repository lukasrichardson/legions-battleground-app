
export default interface BanlistItem {
  name: string;
  status: BanlistStatus;
}

export enum BanlistStatus {
  SUSPENDED = "suspended",
  RESTRICTED = "restricted",
  LIMITED = "limited",
  UNRESTRICTED = "unrestricted",
}