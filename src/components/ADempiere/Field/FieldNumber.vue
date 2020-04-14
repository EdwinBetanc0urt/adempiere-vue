<template>
  <el-tooltip
    v-model="isShowed"
    :manual="true"
    :content="valueToDisplay"
    placement="top"
    effect="light"
  >
    <el-input-number
      :ref="metadata.columnName"
      v-model="value"
      type="number"
      :min="minValue"
      :max="maxValue"
      :placeholder="metadata.help"
      :disabled="isDisabled"
      :precision="precision"
      controls-position="right"
      :class="'display-type-amount'"
      @change="preHandleChange"
      @shortkey.native="changeValue"
      @blur="isShowed = false"
      @input.native="validateInput"
      @keydown.native="calculateValue"
      @keyup.enter.native="changeValue"
    />
  </el-tooltip>
</template>

<script>
import { fieldMixin } from '@/components/ADempiere/Field/FieldMixin'
import { FIELDS_DECIMALS } from '@/utils/ADempiere/references'
// import { operationPattern } from '@/utils/ADempiere/valueUtils.js'

export default {
  name: 'FieldNumber',
  mixins: [fieldMixin],
  data() {
    // value render
    let value = this.metadata.value
    if (this.metadata.inTable) {
      value = this.valueModel
    }
    value = this.validateValue(value)
    return {
      value,
      valueToDisplay: typeof value === 'number' ? String(value) : '',
      isShowed: false
    }
  },
  computed: {
    maxValue() {
      if (this.isEmptyValue(this.metadata.valueMax)) {
        return Infinity
      }
      return Number(this.metadata.valueMax)
    },
    minValue() {
      if (this.isEmptyValue(this.metadata.valueMin)) {
        return -Infinity
      }
      return Number(this.metadata.valueMin)
    },
    cssClass() {
      return this.metadata.referenceType
        .split(/(?=[A-Z])/)
        .join('-')
        .toLowerCase()
    },
    precision() {
      // Amount, Costs+Prices, Number, Quantity
      if (FIELDS_DECIMALS.includes(this.metadata.referenceType)) {
        return 2
      }
      return undefined
    }
  },
  watch: {
    // enable to dataTable records
    valueModel(value) {
      if (this.metadata.inTable) {
        this.value = this.validateValue(value)
      }
    },
    'metadata.value'(value) {
      if (!this.metadata.inTable) {
        this.value = this.validateValue(value)
      }
    }
  },
  methods: {
    validateValue(value) {
      if (this.isEmptyValue(value)) {
        return undefined
      }
      return Number(value)
    },
    calculateValue(event) {
      const result = this.calculationValue(this.value, event)
      if (!this.isEmptyValue(result)) {
        this.valueToDisplay = result
      } else {
        this.valueToDisplay = '...'
      }
      this.isShowed = true

      /**
      const isAllowed = event.key.match(oeprationPattern)
      if (isAllowed) {
        const result = this.calculationValue(this.value, event)
        if (!this.isEmptyValue(result)) {
          this.valueToDisplay = result
        } else {
          this.valueToDisplay = '...'
        }
        this.isShowed = true
      } else {
        const { selectionStart, selectionEnd } = event.target
        if (event.key === 'Backspace') {
          const newValue = this.deleteChar({ value: this.value, selectionStart, selectionEnd })
          if (newValue > 0) {
            event.preventDefault()
            const result = this.calculationValue(newValue, event)
            if (!this.isEmptyValue(result)) {
              this.value = this.validateValue(result)
              this.valueToDisplay = result
            } else {
              this.valueToDisplay = '...'
            }
            this.isShowed = true
          }
        } else if (event.key === 'Delete') {
          const newValue = this.deleteChar({ value: this.value, selectionStart, selectionEnd, isReverse: false })
          if (String(this.value).slice(-1) > 0) {
            event.preventDefault()
            const newValue = String(this.value).slice(-1)
            const result = this.calculationValue(newValue, event)
            if (!this.isEmptyValue(result)) {
              this.value = this.validateValue(result)
              this.valueToDisplay = result
            } else {
              this.valueToDisplay = '...'
            }
            this.isShowed = true
          }
        } else {
          event.preventDefault()
        }
      }
      */
    },
    validateInput(event) {
      const value = String(event.target.value)
        .replace(/[^\d\/.()%\*\+\-]/, '')
      this.value = value
    },
    changeValue() {
      if (!this.isEmptyValue(this.valueToDisplay) && this.valueToDisplay !== '...') {
        const result = this.validateValue(this.valueToDisplay)
        this.preHandleChange(result)
      }
      this.isShowed = false
    }
  }
}
</script>

<style lang="scss">
  /* if is controls width 100% in container */
  .el-input-number, .el-input {
    width: 100% !important; /* ADempiere Custom */
  }

  /** Amount reference **/
  .display-type-amount {
    text-align: right !important;
    input, .el-input__inner {
      text-align: right !important;
    }
  }
</style>
