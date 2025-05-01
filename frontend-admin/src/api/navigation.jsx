import React from "react";
import * as Icons from "react-icons/tb";

// Navigation Items
const navigation = [
  // Dashboard
  {
    name: "Dashboard",
    url: "/",
    icon: <Icons.TbLayout className="menu_icon" />,
  },
  // Catalog
  {
    name: "Catalog",
    icon: <Icons.TbBuildingWarehouse className="menu_icon" />,
    subMenu: [
      // Tracks
      {
        name: "Manage Tracks",
        url: "/tracks/manage",
        icon: <Icons.TbMusic className="menu_icon" />,
      },
      {
        name: "Add Track",
        url: "/tracks/add",
        icon: <Icons.TbCirclePlus className="menu_icon" />,
      },
    ],
  },
  {
    id: "customers",
    name: "Users",
    url: "/users/manage",
    icon: <Icons.TbUsersGroup />,
    submenus: [
      {
        id: "manage_customers",
        name: "Manage Users",
        url: "/users/manage",
      },
      {
        id: "add_customer",
        name: "add Users",
        url: "/users/add",
      },
    ],
  },
  {
    id: "artists",
    name: "Artists",
    url: "/artists/manage",
    icon: <Icons.TbMicrophone2 className="menu_icon" />,
    submenus: [
      // Use submenus instead of subMenu to match Users structure
      {
        id: "manage_artists",
        name: "Manage Artists",
        url: "/artists/manage",
      },
      {
        id: "add_artist",
        name: "Add Artist",
        url: "/artists/add",
      },
    ],
  },
  {
    id: "genres",
    name: "Genres",
    url: "/genres/manage",
    icon: <Icons.TbCategory className="menu_icon" />,
    submenus: [
      {
        id: "manage_genres",
        name: "Manage Genres",
        url: "/genres/manage",
      },
      {
        id: "add_genre",
        name: "Add Genre",
        url: "/genres/add",
      },
    ],
  },
  {
    name: "Payment Orders",
    url: "/orders", // Define the route for the new page
    icon: <Icons.TbReceipt className="menu_icon" />, // Using receipt icon
  },
];

export default navigation;
