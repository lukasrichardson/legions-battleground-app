'use client'
import IMenuItem from "@/client/interfaces/IMenuItem";
import { Menu } from "antd";
import { MenuItemType } from "antd/es/menu/interface";
import { FC } from "react";

interface CardMenuProps {
  items: IMenuItem[];
  onMenuItemClick?: (items: IMenuItem[], key: string|number) => void;
}


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
        items={(items||[]) as MenuItemType[]}
      />
  );
}

export default CardMenu;