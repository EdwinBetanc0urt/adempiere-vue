<template>
  <div v-if="isLoading">
    <context-menu
      :parent-uuid="containerUuid"
      :parent-panel="panelType"
      :report="reportMetadata.isReport"
    />
    <el-row :gutter="20">
      <el-col :span="24">
        <h2 v-show="checkValue(reportMetadata.description)" class="warn-content text-center">
          <div>{{ reportMetadata.description }}  </div>
        </h2>
        <code v-show="checkValue(reportMetadata.help)" v-html="reportMetadata.help" />
        <panel
          v-if="isLoading"
          :position-tab="reportMetadata.accesLevel"
          :container-uuid="containerUuid"
          :metadata-tab="reportMetadata"
          :is-edit="isEdit"
          panel-type="report"
        />
      </el-col>
    </el-row>
  </div>
  <div v-else style="padding: 20px 100px">
    <h3>
      Loading Report...
    </h3>
  </div>
</template>

<script>
// When supporting the processes, smart browser and reports,
// the submenu and sticky must be placed in the layout
import ContextMenu from '@/components/ADempiere/ContextMenu'
import Panel from '@/components/ADempiere/Panel'

export default {
  name: 'Report',
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
      reportMetadata: {},
      containerUuid: this.$route.meta.uuid,
      isLoading: false
    }
  },
  created() {
    this.getProcess(this.$route.meta.uuid)
  },
  methods: {
    getProcess(uuid = null) {
      if (!uuid) {
        uuid = this.$route.meta.uuid
      }

      var process = this.$store.getters.getProcess(uuid)
      if (typeof process === 'undefined') {
        this.$store.dispatch('getProcessAPI', uuid)
          .then(response => {
            this.reportMetadata = response
            this.isLoading = true
          })
          .catch(err => {
            this.isLoading = true
            console.log('Dictionary Process - Error ' + err.code + ': ' + err.message)
          })
      } else {
        this.isLoading = true
        this.reportMetadata = process
      }
    },
    checkValue(text) {
      if (text !== '') {
        return true
      }
    },
    htmlDecode(text) {
      var reportMetadata = document.createElement('div')
      reportMetadata.innerHTML = text
      return reportMetadata.childNodes[0].nodeValue
    }
  }
}
</script>

<style scoped >
  .warn-content {
    margin: 10px 0px !important;
  }
</style>
