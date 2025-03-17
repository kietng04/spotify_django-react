import { atom } from "recoil";


export const searchValue = atom({
    key: "app.search.searchInputValue", 
    default: "",
});