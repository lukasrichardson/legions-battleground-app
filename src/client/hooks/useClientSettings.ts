import { useEffect } from "react";
import { setHoverMenu, setLegacyMenu, setTransparentOnBlur, setDeckbuildGroupedView, setOpenHand } from "../redux/clientSettingsSlice";
import { useAppSelector, useAppDispatch } from "../redux/hooks";

export default function useClientSettings() {
  const dispatch = useAppDispatch();
  const clientSettings = useAppSelector((state) => state.clientSettings);
  const { hoverMenu, legacyMenu, transparentOnBlur, deckbuild_groupedView, openHand } = clientSettings;
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
  const setDeckbuildGroupedViewSetting = (value: boolean) => {
    localStorage?.setItem('deckbuildGroupedView', value.toString());
    dispatch(setDeckbuildGroupedView(value));
  }
  const setOpenHandSetting = (value: boolean) => {
    dispatch(setOpenHand(value));
  }
  useEffect(() => {
    const storedHoverMenu = localStorage?.getItem('hoverMenu');
    const storedLegacyMenu = localStorage?.getItem('legacyMenu');
    const storedTransparentOnBlur = localStorage?.getItem('transparentOnBlur');
    const storedDeckbuildGroupedView = localStorage?.getItem('deckbuildGroupedView');

    if (storedTransparentOnBlur !== null) {
      dispatch(setTransparentOnBlur(storedTransparentOnBlur === 'true'));
    }
    if (storedHoverMenu !== null) {
      dispatch(setHoverMenu(storedHoverMenu === 'true'));
    }
    if (storedLegacyMenu !== null) {
      dispatch(setLegacyMenu(storedLegacyMenu === 'true'));
    }
    if (storedDeckbuildGroupedView !== null) {
      dispatch(setDeckbuildGroupedView(storedDeckbuildGroupedView === 'true'));
    }
  }, [dispatch]);
  return { hoverMenu, legacyMenu, transparentOnBlur, deckbuild_groupedView, openHand, setHoverMenu: setHoverMenuSetting, setLegacyMenu: setLegacyMenuSetting, setTransparentOnBlur: setTransparentOnBlurSetting, setDeckbuildGroupedView: setDeckbuildGroupedViewSetting, setOpenHand: setOpenHandSetting }
}