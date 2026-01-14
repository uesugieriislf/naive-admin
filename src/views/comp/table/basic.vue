<template>
  <n-card :bordered="false" class="proCard">
    <BasicTable
      title="表格列表"
      titleTooltip="这是一个提示"
      :columns="columns"
      :request="loadDataTable"
      :row-key="(row) => row.id"
      ref="actionRef"
      :actionColumn="actionColumn"
      :scroll-x="1360"
      @update:checked-row-keys="onCheckedRow"
    >
      <template #toolbar>
        <n-button type="primary" @click="handleImport" icon-placement="left" style="margin-right: 8px;">
          <template #icon>
            <n-icon><UploadOutlined /></n-icon>
          </template>
          导入Excel
        </n-button>
      </template>
    </BasicTable>
  </n-card>
</template>

<script lang="ts" setup>
  import { reactive, ref, h } from 'vue';
import { BasicTable, TableAction } from '@/components/Table';
import { getTableList, importTableData } from '@/api/table/list';
import { columns } from './basicColumns';
import { useDialog, useMessage, useNotification } from 'naive-ui';
import { DeleteOutlined, EditOutlined, UploadOutlined } from '@vicons/antd';

  const message = useMessage();
  const dialog = useDialog();
  const notification = useNotification();
  const actionRef = ref();

  const params = reactive({
    pageSize: 5,
    name: 'NaiveAdmin',
  });

  const actionColumn = reactive({
    width: 180,
    title: '操作',
    key: 'action',
    fixed: 'right',
    align: 'center',
    render(record) {
      return h(TableAction as any, {
        style: 'button',
        actions: createActions(record),
      });
    },
  });

  function createActions(record) {
    return [
      {
        label: '删除',
        // 配置 color 会覆盖 type
        icon: DeleteOutlined,
        onClick: handleDelete.bind(null, record),
        // 根据权限控制是否显示: 有权限，会显示，支持多个
        auth: ['basic_list'],
      },
      {
        label: '编辑',
        icon: EditOutlined,
        onClick: handleEdit.bind(null, record),
        auth: ['basic_list'],
      },
    ];
  }

  const loadDataTable = async (res) => {
    return await getTableList({ ...params, ...res });
  };

  function onCheckedRow(rowKeys) {
    console.log(rowKeys);
  }

  function handleDelete(record) {
    console.log(record);
    dialog.info({
      title: '提示',
      content: `您想删除${record.name}`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        message.success('删除成功');
      },
      onNegativeClick: () => {},
    });
  }

  function handleEdit(record) {
    console.log(record);
    message.success('您点击了编辑按钮');
  }

  // 处理Excel导入
  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        // 创建FormData对象
        const formData = new FormData();
        formData.append('file', file);
        
        // 调用导入API
        const result = await importTableData(formData);
        
        // 显示成功提示
        notification.success({
          title: '导入成功',
          content: `成功导入 ${result.successCount} 条数据`,
          duration: 3000,
        });
        
        // 刷新表格
        actionRef.value?.reload();
      } catch (error) {
        notification.error({
          title: '导入失败',
          content: error.message || '导入过程中出现错误',
          duration: 3000,
        });
      }
    };
    input.click();
  }
</script>

<style lang="less" scoped></style>
