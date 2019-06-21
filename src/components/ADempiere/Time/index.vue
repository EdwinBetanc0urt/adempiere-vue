<template>
  <el-time-picker
    v-model="value"
    :value-format="metadata.VFormat"
    :picker-options="{
      selectableRange: metadata.Range,
      minTime: metadata.valueMin,
      maxTime: metadata.valueMax
    }"
    :is-range="isPickerRange"
    range-separator="-"
    placeholder="Select time"
    @change="handleChange"
  />
</template>

<script>
export default {
  name: 'Time',
  props: {
    metadata: {
      type: Object,
      required: true
    },
    valueModel: {
      type: String,
      default: undefined
    }
  },
  data() {
    return {
      value: this.metadata.value
    }
  },
  computed: {
    isPickerRange() {
      if (this.metadata.isRange && !this.metadata.inTable) {
        return true
      }
      return false
    }
  },
  watch: {
    valueModel() {
      this.value = this.valueModel
    }
  },
  beforeMount() {
    // enable to dataTable records
    if (typeof this.valueModel !== 'undefined') {
      this.value = this.valueModel
    }
  },
  methods: {
    handleChange() {
      if (this.metadata.inTable) {
        this.$store.dispatch('notifyCellTableChange', {
          parentUuid: this.metadata.parentUuid,
          containerUuid: this.metadata.containerUuid,
          columnName: this.metadata.columnName,
          newValue: this.value,
          keyColumn: this.metadata.keyColumn,
          tableIndex: this.metadata.tableIndex,
          rowKey: this.metadata.rowKey
        })
      } else {
        this.$store.dispatch('notifyFieldChange', {
          parentUuid: this.metadata.parentUuid,
          containerUuid: this.metadata.containerUuid,
          columnName: this.metadata.columnName,
          newValue: this.value
        })
      }
    }
  }
}
</script>

<style>
  .el-date-editor.el-input, .el-date-editor.el-input__inner {
    width: 100% !important;
  }
</style>
