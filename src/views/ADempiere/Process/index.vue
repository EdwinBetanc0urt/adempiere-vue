<template>
  <div v-if="isLoading">
    <context-menu
      class="sticky-submenu"
      :parent-uuid="containerUuid"
      :parent-panel="panelType"
      :report="processMetadata.isReport"
    />
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="content-collapse">
          <h3 v-show="!isEmptyValue(processMetadata.name)" class="warn-content text-center">
            <el-popover
              v-if="!isEmptyValue(processMetadata.help)"
              placement="top-start"
              :title="processMetadata.name"
              width="400"
              trigger="hover"
            >
              <div v-html="processMetadata.help" />
              <el-button slot="reference" type="text" class="title">{{ processMetadata.name }}</el-button>
            </el-popover>
            <el-button v-if="isEmptyValue(processMetadata.help)" slot="reference" type="text" class="title">{{ processMetadata.name }}</el-button>
          </h3>
          <panel
            v-if="isLoading"
            :position-tab="processMetadata.accesLevel"
            :container-uuid="processUuid"
            :metadata="processMetadata"
            :is-edit="isEdit"
            :panel-type="panelType"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
  <div
    v-else
    v-loading="!isLoading"
    :element-loading-text="$t('notifications.loading')"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(255, 255, 255, 0.8)"
    style="padding: 100px 100px; heigth: 100%"
  />
</template>

<script>
// When supporting the processes, smart browser and reports,
// the ContextMenu and sticky must be placed in the layout
import ContextMenu from '@/components/ADempiere/ContextMenu'
import Panel from '@/components/ADempiere/Panel'
import { isEmptyValue } from '@/utils/ADempiere/valueUtil'

export default {
  name: 'Process',
  components: {
    Panel,
    ContextMenu
  },
  props: {
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      processMetadata: {},
      processUuid: this.$route.meta.uuid,
      containerUuid: this.$route.meta.uuid,
      isLoading: false,
      recordUuid: this.$route.params.uuidRecord,
      activeNames: [],
      panelType: 'process'
    }
  },
  created() {
    this.getProcess(this.$route.meta.uuid)
    // this.subscribeAction()
  },
  methods: {
    isEmptyValue,
    getProcess(uuid = null) {
      if (!uuid) {
        uuid = this.$route.meta.uuid
      }
      var process = this.$store.getters.getProcess(uuid)
      if (typeof process === 'undefined') {
        this.$store.dispatch('getPanelAndFields', {
          containerUuid: uuid,
          type: this.panelType
        }).then(response => {
          this.processMetadata = response
          this.isLoading = true
        }).catch(err => {
          this.isLoading = true
          console.log('Dictionary Process - Error ' + err.code + ': ' + err.message)
        })
      } else {
        this.isLoading = true
        this.processMetadata = process
      }
    }
  }
}
</script>

<style scoped >
  .title {
    color: #000000;
    text-size-adjust: 20px;
    font-size: 100%;
    font-weight: 605!important;
  }
  .warn-content {
    margin: 0px 0px !important;
    padding-top: 39px !important;
  }
  .content-help {
    width: 100%;
    height: 200%;
    padding-left: 39px !important;
  }
  .el-card {
    width: 100% !important;
    height: 200% !important;
  }
  .sticky-submenu {
    position: absolute !important;
    right: 0;
    top: 0;
  }
  .content-collapse {
    padding-left: 20 px !important;
    padding-top: 50 px !important;
  }
</style>
