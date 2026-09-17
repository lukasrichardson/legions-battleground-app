'use client'
import IMenuItem from "@/client/interfaces/IMenuItem";
import { Menu } from "antd";
import { MenuItemType } from "antd/es/menu/interface";
import { FC } from "react";

interface CardMenuProps {
  items: IMenuItem[];
  onMenuItemClick?: (items: IMenuItem[], key: string|number) => void;
}

const toAntdMenuItems = (items: IMenuItem[]): MenuItemType[] =>
  items.map(({ children, ...item }) => {
    delete item.menuAction;
    return {
      ...item,
      ...(children ? { children: toAntdMenuItems(children) } : {}),
    };
  }) as MenuItemType[];

const CardMenu: FC<CardMenuProps> = ({items, onMenuItemClick}) => {
  return (
    <Menu
        onClick={(e: { domEvent: { stopPropagation: () => void; }; key: string; }) => {
          e.domEvent.stopPropagation();
          if (!onMenuItemClick) return;
          onMenuItemClick(items, e.key);
        }}
        style={{ width: "fit-content" }}
        mode="vertical"
        items={toAntdMenuItems(items || [])}
      />
  );
}

export default CardMenu;
