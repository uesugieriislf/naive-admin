import { Alova } from '@/utils/http/alova/index';
export interface ListDate {
  label: string;
  key: string;
  type: number;
  subtitle: string;
  openType: number;
  auth: string;
  path: string;
  children?: ListDate[];
}

export function adminMenus() {
  return Alova.Get('/menus');
}

export function getMenuList(params?) {
  return Alova.Get<{ list: ListDate[] }>('/menu/list', {
    params,
  });
}

export function getMenuTree() {
  return Alova.Get<{ list: ListDate[] }>('/menu/tree');
}

export function createMenu(data) {
  return Alova.Post('/menu', data);
}

export function updateMenu(id, data) {
  return Alova.Put(`/menu/${id}`, data);
}

export function deleteMenu(id) {
  return Alova.Delete(`/menu/${id}`);
}

export function getMenuDetail(id) {
  return Alova.Get(`/menu/${id}`);
}
