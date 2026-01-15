import { Alova } from '@/utils/http/alova/index';

export function getRoleList(params) {
  return Alova.Get('/role/list', { params });
}

export function createRole(data) {
  return Alova.Post('/role', data);
}

export function updateRole(id, data) {
  return Alova.Put(`/role/${id}`, data);
}

export function deleteRole(id) {
  return Alova.Delete(`/role/${id}`);
}

export function getRoleDetail(id) {
  return Alova.Get(`/role/${id}`);
}
