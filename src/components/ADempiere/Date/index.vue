<template>
  <el-date-picker
    v-model="value"
    :format="formatView"
    :value-format="formatSend"
    :type="typePicker"
    :placeholder="metadata.help"
    range-separator="-"
    start-placeholder="Start date"
    end-placeholder="End date"
    unlink-panels
    @change="handleChange"
  />
</template>

<script>
import { clientDateTime } from '@/utils/ADempiere/valueUtil.js'

export default {
  name: 'Date',
  props: {
    metadata: {
      type: Object,
      required: true
    },
    valueModel: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      value: this.metadata.value,
      formatView: undefined,
      formatSend: undefined
    }
  },
  computed: {
    typePicker() {
      var time = ''
      var range = ''
      if (String(this.metadata.displayType) === String(16)) {
        time = 'time'
      }
      if (this.metadata.isRange && !this.metadata.inTable) {
        range = 'range'
      }
      return 'date' + time + range
    }
  },
  watch: {
    valueModel() {
      this.value = this.valueModel
    }
  },
  created() {
    this.checkValueFormat()
  },
  beforeMount() {
    // enable to dataTable records
    if (typeof this.valueModel !== 'undefined') {
      this.value = this.valueModel
    }
  },
  methods: {
    clientDateTime,
    /**
     * Parse the date format to be compatible with element-ui
     */
    checkValueFormat() {
      // Date = 15
      var format = this.metadata.VFormat
        .replace(/[Y]/gi, 'y')
        .replace(/[m]/gi, 'M')
        .replace(/[D]/gi, 'd')

      if (format === '') {
        format = 'yyyy-MM-dd'
      }
      if (this.typePicker.replace('range', '') === 'datetime') {
        format = format + ' hh:mm:ss A'
      }
      this.formatView = format
      this.formatSend = format
        .replace(/[h]/gi, 'H')
        .replace(/[aA]/gi, '')
    },
    convertTimestamp(value) {
      return (new Date(value)).getTime()
    },
    handleChange(value) {
      var valueFirst, valueTo

      valueFirst = value
      if ((this.metadata.isRange && !this.metadata.inTable) || value.isArray) {
        valueFirst = value[0]
        valueTo = value[1]
      }

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
          newValue: valueFirst,
          valueTo: valueTo
        })
      }
    }
  }
}
</script>

<style scoped>
  .el-date-editor.el-input, .el-date-editor.el-input__inner {
    width: 100% !important;
  }
</style>
