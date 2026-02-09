import MenuItemAction from "@/client/enums/MenuItemAction";
import { CARD_TARGET } from "@/shared/enums/CardTarget";

export interface INewMenuItem {
  key: string;
  title: string|number;
  icon: string|null;
  label: string;
  children?: IMenuItem[];
  menuAction?: MenuItemAction;
  target?: CARD_TARGET
}
export default interface IMenuItem {
  key: string;
  title: string|number;
  icon: string|null;
  label: string;
  children?: IMenuItem[];
  menuAction?: MenuItemAction;
}