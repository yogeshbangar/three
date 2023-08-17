import { MODE } from "./util.js";
export default class UI {
  showMenu = true;
  constructor(setMode, mode) {
    const polyBtn = document.getElementById("polygon");
    const brushBtn = document.getElementById("brush");
    const showHideBtn = document.getElementById("menu-btn");
    polyBtn.onclick = function () {
      polyBtn.style.background = "#ffaaaa";
      brushBtn.style.background = "unset";
      setMode(MODE.polygon);
    };
    brushBtn.onclick = function () {
      brushBtn.style.background = "#ffaaaa";
      polyBtn.style.background = "unset";
      setMode(MODE.brush);
    };
    showHideBtn.onclick = () => {
      this.showMenu = !this.showMenu;
      const menuList = document.getElementById("menu-list");
      menuList.style.display = this.showMenu ? "block" : "none";
      showHideBtn.innerHTML = this.showMenu ? "Hide" : "Show"
    };
    if (mode === MODE.polygon) {
      polyBtn.style.background = "#ffaaaa";
      brushBtn.style.background = "unset";
    }
    if (mode === MODE.brush) {
      brushBtn.style.background = "#ffaaaa";
      polyBtn.style.background = "unset";
    }
  }
}
