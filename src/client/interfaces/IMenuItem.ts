import MenuItemAction from "@/client/enums/MenuItemAction";

export default interface IMenuItem {
  key: string;
  title: string|number;
  icon: string|null;
  label: string;
  children?: IMenuItem[];
  menuAction?: MenuItemAction;
}