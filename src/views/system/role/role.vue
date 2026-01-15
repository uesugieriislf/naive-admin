<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="角色权限管理">
        页面数据为 Mock 示例数据，非真实数据。
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <BasicTable
        :columns="columns"
        :request="loadDataTable"
        :row-key="(row) => row.id"
        ref="actionRef"
        :actionColumn="actionColumn"
        @update:checked-row-keys="onCheckedRow"
      >
        <template #tableTitle>
          <n-button type="primary" @click="addRole">
            <template #icon>
              <n-icon>
                <PlusOutlined />
              </n-icon>
            </template>
            新增角色
          </n-button>
        </template>

        <template #action>
          <TableAction />
        </template>
      </BasicTable>
    </n-card>

    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="editRoleTitle">
      <div class="py-3 menu-list">
        <n-tree
          block-line
          cascade
          checkable
          :virtual-scroll="true"
          :data="treeData"
          :expandedKeys="expandedKeys"
          :checked-keys="checkedKeys"
          style="max-height: 950px; overflow: hidden"
          @update:checked-keys="checkedTree"
          @update:expanded-keys="onExpandedKeys"
        />
      </div>
      <template #action>
        <n-space>
          <n-button type="info" ghost icon-placement="left" @click="packHandle">
            全部{{ expandedKeys.length ? '收起' : '展开' }}
          </n-button>

          <n-button type="info" ghost icon-placement="left" @click="checkedAllHandle">
            全部{{ checkedAll ? '取消' : '选择' }}
          </n-button>
          <n-button type="primary" :loading="formBtnLoading" @click="confirmForm">提交</n-button>
        </n-space>
      </template>
    </n-modal>
    <CreateModal ref="createModalRef" @success="reloadTable" />
    <EditModal ref="editModalRef" @success="reloadTable" />
  </div>
</template>

<script lang="ts" setup>
  import { reactive, ref, unref, h, onMounted } from 'vue';
  import { useMessage, useDialog } from 'naive-ui';
  import { BasicTable, TableAction } from '@/components/Table';
  import { getRoleList, deleteRole, updateRole } from '@/api/system/role';
  import { getMenuList } from '@/api/system/menu';
  import { columns } from './columns';
  import { PlusOutlined } from '@vicons/antd';
  import { getTreeAll } from '@/utils';
  import CreateModal from './CreateModal.vue';
  import EditModal from './EditModal.vue';
  import type { ListDate } from '@/api/system/menu';

  const message = useMessage();
  const dialog = useDialog();
  const actionRef = ref();
  const createModalRef = ref();
  const editModalRef = ref();
  const showModal = ref(false);
  const formBtnLoading = ref(false);
  const checkedAll = ref(false);
  const editRoleTitle = ref('');
  const currentEditRoleId = ref<number>();
  const treeData = ref<ListDate[]>([]);
  const expandedKeys = ref<string[]>([]);
  const checkedKeys = ref<string[]>(['console', 'step-form']);

  const params = reactive({
    name: '',
  });

  const actionColumn = reactive({
    width: 250,
    title: '操作',
    key: 'action',
    fixed: 'right',
    render(record) {
      return h(TableAction, {
        style: 'button',
        actions: [
          {
            label: '菜单权限',
            onClick: handleMenuAuth.bind(null, record),
            ifShow: () => {
              return true;
            },
          },
          {
            label: '编辑',
            onClick: handleEdit.bind(null, record),
            ifShow: () => {
              return true;
            },
          },
          {
            label: '删除',
            onClick: handleDelete.bind(null, record),
            ifShow: () => {
              return true;
            },
          },
        ],
      });
    },
  });

  const loadDataTable = async (res: any) => {
    let _params = {
      ...unref(params),
      ...res,
    };
    const response = await getRoleList(_params);
    return response.result;
  };

  function addRole() {
    createModalRef.value.openModal();
  }

  function onCheckedRow(rowKeys: any[]) {
    console.log(rowKeys);
  }

  function reloadTable() {
    actionRef.value.reload();
  }

  function confirmForm(e: any) {
    e.preventDefault();
    formBtnLoading.value = true;
    updateRole(currentEditRoleId.value!, { menuKeys: checkedKeys.value })
      .then(() => {
        showModal.value = false;
        message.success('提交成功');
        reloadTable();
      })
      .catch((error: any) => {
        const errorMsg = error?.response?.data?.message || error?.message || '提交失败';
        message.error(errorMsg);
      })
      .finally(() => {
        formBtnLoading.value = false;
      });
  }

  function handleEdit(record: Recordable) {
    console.log('点击了编辑', record);
    // router.push({ name: 'basic-info', params: { id: record.id } });
    editModalRef.value.showModal(record);
  }

  async function handleDelete(record: Recordable) {
    dialog.warning({
      title: '警告',
      content: `确定要删除角色 "${record.name}" 吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await deleteRole(record.id);
          message.success('删除成功');
          reloadTable();
        } catch (error: any) {
          const errorMsg = error?.response?.data?.message || error?.message || '删除失败';
          message.error(errorMsg);
        }
      },
    });
  }

  function handleMenuAuth(record: Recordable) {
    editRoleTitle.value = `分配 ${record.name} 的菜单权限`;
    checkedKeys.value = record.menu_keys || [];
    currentEditRoleId.value = record.id;
    showModal.value = true;
  }

  function checkedTree(keys) {
    checkedKeys.value = [checkedKeys.value, ...keys];
  }

  function onExpandedKeys(keys) {
    expandedKeys.value = keys;
  }

  function packHandle() {
    if (expandedKeys.value.length) {
      expandedKeys.value = [];
    } else {
      expandedKeys.value = treeData.value.map((item: any) => item.key) as [];
    }
  }

  function checkedAllHandle() {
    if (!checkedAll.value) {
      checkedKeys.value = getTreeAll(treeData.value);
      checkedAll.value = true;
    } else {
      checkedKeys.value = [];
      checkedAll.value = false;
    }
  }

  onMounted(async () => {
    const treeMenuList = await getMenuList();
    expandedKeys.value = treeMenuList?.result?.list?.map((item) => item.key) || [];
    treeData.value = treeMenuList?.result?.list || [];
  });
</script>

<style lang="less" scoped></style>
