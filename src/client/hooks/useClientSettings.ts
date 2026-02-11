import { useEffect } from "react";
import { setHoverMenu, setLegacyMenu, setTransparentOnBlur } from "../redux/clientSettingsSlice";
import { useAppSelector, useAppDispatch } from "../redux/hooks";

export default function useClientSettings() {
  const dispatch = useAppDispatch();
  const clientSettings = useAppSelector((state) => state.clientSettings);
  const hoverMenu = clientSettings.hoverMenu;
  const legacyMenu = clientSettings.legacyMenu;
  const transparentOnBlur = clientSettings.transparentOnBlur;
  const setHoverMenuSetting = (value: boolean) => {
    localStorage?.setItem('hoverMenu', value.toString());
    dispatch(setHoverMenu(value));
  }
  const setLegacyMenuSetting = (value: boolean) => {
    localStorage?.setItem('legacyMenu', value.toString());
    dispatch(setLegacyMenu(value));
  }
  const setTransparentOnBlurSetting = (value: boolean) => {
    localStorage?.setItem('transparentOnBlur', value.toString());
    dispatch(setTransparentOnBlur(value));
  }
  useEffect(() => {
    const storedHoverMenu = localStorage?.getItem('hoverMenu');
    const storedLegacyMenu = localStorage?.getItem('legacyMenu');
    const storedTransparentOnBlur = localStorage?.getItem('transparentOnBlur');
    
    if (storedTransparentOnBlur !== null) {
      dispatch(setTransparentOnBlur(storedTransparentOnBlur === 'true'));
    }
    if (storedHoverMenu !== null) {
      dispatch(setHoverMenu(storedHoverMenu === 'true'));
    }
    if (storedLegacyMenu !== null) {
      dispatch(setLegacyMenu(storedLegacyMenu === 'true'));
    }
  }, [dispatch]);
  return { hoverMenu, legacyMenu, transparentOnBlur, setHoverMenu: setHoverMenuSetting, setLegacyMenu: setLegacyMenuSetting, setTransparentOnBlur: setTransparentOnBlurSetting }
}