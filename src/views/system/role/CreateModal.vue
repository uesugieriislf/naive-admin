<template>
  <basicModal @register="modalRegister" ref="modalRef" @on-ok="okModal">
    <div class="pt-8">
      <BasicForm @register="registerForm" />
    </div>
  </basicModal>
</template>

<script lang="ts" setup>
  import { FormSchema, useForm } from '@/components/Form';
  import { basicModal, useModal } from '@/components/Modal';
  import { createRole } from '@/api/system/role';
  import { useMessage } from 'naive-ui';

  const message = useMessage();
  const emit = defineEmits(['success']);

  const schemas: FormSchema[] = [
    {
      field: 'name',
      component: 'NInput',
      label: '角色名称',
      componentProps: {
        placeholder: '请输入角色名称',
      },
      rules: [{ required: true, message: '请输入角色名称', trigger: ['blur'] }],
    },
    {
      field: 'explain',
      component: 'NInput',
      label: '角色说明',
      componentProps: {
        type: 'textarea',
        placeholder: '请输入角色角色说明',
      },
    },
    {
      field: 'isDefault',
      component: 'NSwitch',
      label: '默认角色',
      componentProps: {},
    },
  ];

  const [registerForm, { submit, resetFields }] = useForm({
    gridProps: { cols: 1 },
    collapsedRows: 3,
    labelWidth: 80,
    layout: 'horizontal',
    submitButtonText: '保存',
    showActionButtonGroup: false,
    schemas,
  });

  const [modalRegister, { openModal, closeModal, setSubLoading }] = useModal({
    title: '新增角色',
    subBtuText: '保存',
  });

  async function okModal() {
    const formRes = await submit();
    if (formRes) {
      try {
        await createRole(formRes);
        message.success('创建成功');
        closeModal();
        resetFields();
        emit('success');
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error?.message || '创建失败';
        message.error(errorMsg);
      } finally {
        setSubLoading(false);
      }
    } else {
      setSubLoading(false);
    }
  }

  defineExpose({
    openModal,
  });
</script>
