import React, { useState } from 'react';
import * as Icons from 'react-icons/tb';
import { useDispatch } from 'react-redux';
import Logo from '../../images/common/logo.svg';
import { Link, NavLink } from 'react-router-dom';
import navigation from '../../api/navigation.jsx';
import {logout} from '../../store/slices/authenticationSlice.jsx';

const Sidebar = () => {
  const dispatch = useDispatch();
  const [toggle, setToggle] = useState(null);
  const [sidebar, setSidebar] = useState(false);

  const handleManu = (key) => {
    setToggle((prevToggle) => (prevToggle === key ? null : key));
  };

  const handleSidebar = () => {
    setSidebar(!sidebar);
  };

  const handleIsLogout = () => {
    dispatch(logout())
  };

  return (
    <div className={`sidemenu ${sidebar ? 'active' : ''}`}>
      {/* Admin User */}
      <div className="sidebar_profile">
        {/*<Link to="/" className="logo">
          <img src={Logo} alt="logo" />
        </Link>*/}

        <h2 className="logo_text">Your Logo</h2>
        <Link className="navbar_icon menu_sidebar" onClick={handleSidebar}>
          <Icons.TbChevronsLeft className={`${sidebar ? 'active' : ''}`} />
        </Link>
      </div>
      {/* menu links */}
      <ul className="menu_main">
        {navigation.map(function (navigationItem, key) {
          const hasSubMenu = navigationItem.subMenu || navigationItem.submenus;
          console.log("Sidebar Item:", {
            name: navigationItem.name,
            url: navigationItem.url,
            hasSubMenu: hasSubMenu,
            isRenderingDirectLink: !hasSubMenu
          });
          return (
            <li key={key}>
              {!hasSubMenu ? (
                <NavLink
                  to={`${navigationItem.url}`}
                  className={`menu_link ${toggle === key ? 'active' : ''}`}
                >
                  {navigationItem.icon}
                  <span>{navigationItem.name}</span>
                </NavLink>
              ) : (
                <div className="menu_link" onClick={() => handleManu(key)}>
                  {navigationItem.icon}
                  <span>{navigationItem.name}</span>
                  <Icons.TbChevronDown />
                </div>
              )}
              {hasSubMenu && (
                <ul className={`sub_menu ${toggle === key ? 'active' : ''}`}>
                  {(navigationItem.subMenu || navigationItem.submenus).map(function (subNavigationItem, subKey) {
                    return (
                      <li key={subKey}>
                        <NavLink
                          to={`${subNavigationItem.url}`}
                          className="menu_link"
                        >
                          {subNavigationItem.icon}
                          <span>{subNavigationItem.name}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
        <div
          className={`menu_link`}
          onClick={handleIsLogout}
        >
          <Icons.TbLogout className="menu_icon" />
          <span>Logout</span>
        </div>
      </ul>
    </div>
  );
};

export default Sidebar;