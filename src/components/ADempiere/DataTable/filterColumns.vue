<template>
  <div>
    <el-select
      v-model="selectedFields"
      :filterable="true"
      :placeholder="$t('components.filterableItems')"
      multiple
      size="mini"
      collapse-tags
      value-key="key"
      @change="addField"
    >
      <el-option
        v-for="(item, key) in columnListShowed"
        :key="key"
        :label="item.name"
        :value="item.columnName"
      />
    </el-select>
  </div>
</template>

<script>
export default {
  name: 'FilterColumns',
  props: {
    containerUuid: {
      type: String,
      required: true
    },
    panelType: {
      type: String,
      default: 'window'
    }
  },
  data() {
    return {
      selectedFields: [], // fields optional showd
      columnListShowed: []
    }
  },
  mounted() {
    this.getPanel()
  },
  methods: {
    isDisplayed(field) {
      var isDisplayed = field.isActive && field.isDisplayed && (field.isShowedTableFromUser || field.isDisplayedFromLogic)
      if (field.isShowedTableFromUser) {
        this.selectedFields.push(field.columnName)
      }
      return isDisplayed
    },
    getPanel() {
      var fieldList = this.$store.getters.getFieldsListFromPanel(this.containerUuid)
      if (typeof fieldList === 'undefined' || fieldList.length === 0) {
        this.$store.dispatch('getPanelAndFields', {
          containerUuid: this.containerUuid,
          type: this.panelType.trim()
        }).then(response => {
          this.generatePanel(response.fieldList)
        }).catch(err => {
          console.warn('Field Load Error ' + err.code + ': ' + err.message)
        })
      } else {
        this.generatePanel(fieldList)
      }
    },
    generatePanel(fieldList) {
      this.columnListShowed = fieldList.filter((item) => {
        return this.isDisplayed(item)
      })
    },
    /**
     * @param {array} selectedValues
     */
    addField(selectedValues) {
      this.$store.dispatch('changeColumnShowedFromUser', {
        containerUuid: this.containerUuid,
        fieldsUser: selectedValues,
        show: true
      })
    }
  }
}
</script>
