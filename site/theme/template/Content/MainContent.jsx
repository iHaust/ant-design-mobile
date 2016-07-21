import React from 'react';
import { Link } from 'react-router';
import { Menu } from 'antd';
import Article from './Article';
import ComponentDoc from './ComponentDoc';
import * as utils from '../utils';
import config from '../../';
const SubMenu = Menu.SubMenu;

export default class MainContent extends React.Component {
  static contextTypes = {
    intl: React.PropTypes.object.isRequired,
  }

  componentDidMount() {
    if (!location.hash) {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    } else {
      location.hash = location.hash;
    }
  }

  shouldComponentUpdate(nextProps) {
    const pathname = this.props.location.pathname;
    return pathname !== nextProps.location.pathname ||
      /^\/components\//i.test(pathname);
  }

  getActiveMenuItem(props) {
    return props.params.children || props.location.pathname;
  }

  fileNameToPath(filename) {
    const snippets = filename.replace(/(\/index)?((\.zh-CN)|(\.en-US))?\.md$/i, '').split('/');
    return snippets[snippets.length - 1];
  }

  generateMenuItem(isTop, item) {
    const key = this.fileNameToPath(item.filename);
    const text = isTop ?
            item.title || item.chinese || item.english : [
              <span key="english">{item.title || item.english}</span>,
              <span className="chinese" key="chinese">{item.subtitle || item.chinese}</span>,
            ];
    const disabled = item.disabled;
    const url = item.filename.replace(/(\/index)?((\.zh-CN)|(\.en-US))?\.md$/i, '').toLowerCase();
    const child = !item.link ?
      <Link to={url} disabled={disabled}>
        {text}
      </Link> :
      <a href={item.link} target="_blank" disabled={disabled}>
        {text}
      </a>;

    return (
      <Menu.Item key={key.toLowerCase()} disabled={disabled}>
        {child}
      </Menu.Item>
    );
  }

  isNotTopLevel(level) {
    return level !== 'topLevel';
  }

  generateSubMenuItems(obj) {
    const topLevel = (obj.topLevel || []).map(this.generateMenuItem.bind(this, true));
    const itemGroups = Object.keys(obj).filter(this.isNotTopLevel)
      .sort((a, b) => config.typeOrder[a] - config.typeOrder[b])
      .map((type, index) => {
        const groupItems = obj[type].sort((a, b) => (
          (a.title || a.english).charCodeAt(0) - (b.title || b.english).charCodeAt(0)
        )).map(this.generateMenuItem.bind(this, false));
        return (
          <Menu.ItemGroup key={index} className="sub-menu-item">
            {groupItems}
          </Menu.ItemGroup>
        );
      });
    return [...topLevel, ...itemGroups];
  }

  getMenuItems() {
    const moduleData = this.props.moduleData;
    const menuItems = utils.getMenuItems(moduleData, this.context.intl.locale);
    const topLevel = this.generateSubMenuItems(menuItems.topLevel);
    const subMenu = Object.keys(menuItems).filter(this.isNotTopLevel)
      .sort((a, b) => config.categoryOrder[a] - config.categoryOrder[b])
      .map((category) => {
        const subMenuItems = this.generateSubMenuItems(menuItems[category]);
        return (
          <SubMenu title={<h4>{category}</h4>} key={category}>
            {subMenuItems}
          </SubMenu>
        );
      });
    return [...topLevel, ...subMenu];
  }

  flattenMenu(menu) {
    if (menu.type === Menu.Item) {
      return menu;
    }

    if (Array.isArray(menu)) {
      return menu.reduce((acc, item) => acc.concat(this.flattenMenu(item)), []);
    }

    return this.flattenMenu(menu.props.children);
  }

  getFooterNav(menuItems, activeMenuItem) {
    const menuItemsList = this.flattenMenu(menuItems);
    let activeMenuItemIndex = -1;
    menuItemsList.forEach((menuItem, i) => {
      if (menuItem.key === activeMenuItem) {
        activeMenuItemIndex = i;
      }
    });
    const prev = menuItemsList[activeMenuItemIndex - 1];
    const next = menuItemsList[activeMenuItemIndex + 1];
    return { prev, next };
  }

  render() {
    const props = this.props;
    // console.log('~~~~~~~~~~~')
    // console.log(props)
    // console.log('~~~~~~~~~~~')
    const activeMenuItem = this.getActiveMenuItem(props);
    const menuItems = this.getMenuItems();
    const { prev, next } = this.getFooterNav(menuItems, activeMenuItem);

    const locale = this.context.intl.locale;
    const moduleData = this.props.moduleData;
    const localizedPageData = moduleData.filter((page) =>
      page.meta.filename.toLowerCase().startsWith(props.location.pathname)
    )[0];

    return (
      <div className="main-wrapper">

        <div style={{ width: 240, float: 'left', marginRight: '-1px' }}>
          <Menu className="aside-container" mode="inline"
            defaultOpenKeys={Object.keys(utils.getMenuItems(moduleData, locale))}
            selectedKeys={[activeMenuItem]}
          >
            {menuItems}
          </Menu>
        </div>
        <div className="main-container">
          {
            props.utils.get(props, 'pageData.demo') ?
              <ComponentDoc {...props} doc={localizedPageData} demos={props.demos} /> :
              <Article {...props} content={localizedPageData} />
          }
        </div>
        <section className="prev-next-nav">
          <div className="prev-next-nav-wrap">
            {
              !!prev ?
                React.cloneElement(prev.props.children, { className: 'prev-page' }) :
                null
            }
            {
              !!next ?
                React.cloneElement(next.props.children, { className: 'next-page' }) :
                null
            }
          </div>
        </section>
      </div>
    );
  }
}
