<template>
  <text-base
    :metadata="metadata"
    :value-model="valueModel"
    :pattern="pattern"
    :placeholder="metadata.help"
    :type-input="typeInput"
    :rows="rows"
  />
</template>

<script>
import TextBase from '@/components/ADempiere/TextBase'

export default {
  name: 'TextAreaBase',
  components: {
    TextBase
  },
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
      typeInput: 'textarea',
      pattern: undefined,
      rows: 5
    }
  },
  created() {
    if (this.metadata.inTable) {
      // avoid drastically changing the style of the table
      // this.typeInput = 'text'
      this.rows = 1
    }
  },
  beforeMount() {
    if (this.valueModel !== '') {
      this.value = this.valueModel
    }
  }
}
</script>
