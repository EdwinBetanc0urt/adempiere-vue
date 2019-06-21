<template>
  <el-input-number
    v-model="value"
    :type="typeInput"
    :pattern="pattern"
    :min="minValue"
    :max="maxValue"
    :placeholder="metadata.help"
    controls-position="right"
    :class="'display-type' + metadata.displayType"
    @blur="validateInput"
    @change="handleChange"
  />
</template>

<script>
export default {
  name: 'NumberBase',
  props: {
    metadata: {
      type: Object,
      required: true
    },
    validateInput: {
      type: Function,
      default: () => undefined
    },
    valueModel: {
      type: Number,
      default: undefined
    }
  },
  data() {
    return {
      value: this.metadata.value,
      typeInput: 'number',
      pattern: undefined,
      showControls: true
    }
  },
  computed: {
    maxValue() {
      if (this.metadata.valueMin) {
        return this.metadata.valueMin
      }
      return Infinity
    },
    minValue() {
      if (this.metadata.valueMax) {
        return this.metadata.valueMax
      }
      return -Infinity
    }
  },
  watch: {
    valueModel() {
      this.value = Number(this.valueModel)
    }
  },
  beforeMount() {
    // enable to dataTable records
    if (typeof this.valueModel !== 'undefined') {
      this.value = Number(this.valueModel)
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

<style scoped lang="scss">
  /* if is controls width 100% in container */
  .el-input-number, .el-input {
    width: 100% !important; /* ADempiere Custom */
  }

  /** Amount reference **/
  .display-type-12 {
    input, .el-input__inner {
      text-align: right !important;
    }
  }

</style>
