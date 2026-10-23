'use client'
import IMenuItem from "@/client/interfaces/IMenuItem";
import { Menu } from "antd";
import { MenuItemType } from "antd/es/menu/interface";
import { FC } from "react";

interface CardMenuProps {
  items: IMenuItem[];
  onMenuItemClick?: (items: IMenuItem[], key: string|number) => void;
  inline?: boolean;
}

// Flip horizontally and shift vertically when a nested menu has no room on
// its preferred side. Zero offsets keep shifting inside the visible viewport.
const submenuPlacements = Object.fromEntries([
  ["rightTop", ["tl", "tr"]], ["rightBottom", ["bl", "br"]],
  ["leftTop", ["tr", "tl"]], ["leftBottom", ["br", "bl"]],
].map(([name, points]) => [name, { points, offset: [0, 0], overflow: { adjustX: true, adjustY: true, shiftX: true, shiftY: true } }]));

const toAntdMenuItems = (items: IMenuItem[]): MenuItemType[] =>
  items.map(({ children, ...item }) => {
    delete item.menuAction;
    return {
      ...item,
      ...(children ? { children: toAntdMenuItems(children), popupClassName: "game-card-submenu", popupOffset: [0, 0] } : {}),
    };
  }) as MenuItemType[];

const CardMenu: FC<CardMenuProps> = ({items, onMenuItemClick, inline = false}) => {
  return (
    <Menu
        onClick={(e: { domEvent: { stopPropagation: () => void; }; key: string; }) => {
          e.domEvent.stopPropagation();
          if (!onMenuItemClick) return;
          onMenuItemClick(items, e.key);
        }}
        style={{ width: inline ? "100%" : "fit-content" }}
        mode={inline ? "inline" : "vertical"}
        theme={inline ? "dark" : "light"}
        inlineIndent={12}
        builtinPlacements={submenuPlacements}
        items={toAntdMenuItems(items || [])}
      />
  );
}

export default CardMenu;
