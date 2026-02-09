import { useEffect } from "react";
import { setHoverMenu, setLegacyMenu } from "../redux/clientSettingsSlice";
import { useAppSelector, useAppDispatch } from "../redux/hooks";

export default function useClientSettings() {
  const dispatch = useAppDispatch();
  const hoverMenu = useAppSelector((state) => state.clientSettings.hoverMenu);
  const legacyMenu = useAppSelector((state) => state.clientSettings.legacyMenu);
  const setHoverMenuSetting = (value: boolean) => {
    localStorage?.setItem('hoverMenu', value.toString());
    dispatch(setHoverMenu(value));
  }
  const setLegacyMenuSetting = (value: boolean) => {
    localStorage?.setItem('legacyMenu', value.toString());
    dispatch(setLegacyMenu(value));
  }
  useEffect(() => {
    const storedHoverMenu = localStorage?.getItem('hoverMenu');
    const storedLegacyMenu = localStorage?.getItem('legacyMenu');
    if (storedHoverMenu !== null) {
      dispatch(setHoverMenu(storedHoverMenu === 'true'));
    }
    if (storedLegacyMenu !== null) {
      dispatch(setLegacyMenu(storedLegacyMenu === 'true'));
    }
  }, [dispatch]);
  return { hoverMenu, legacyMenu, setHoverMenu: setHoverMenuSetting, setLegacyMenu: setLegacyMenuSetting }
}