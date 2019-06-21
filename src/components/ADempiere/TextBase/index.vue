<template>
  <el-input
    v-model="value"
    :pattern="pattern"
    :minlength="metadata.MinLength"
    :maxlength="metadata.MaxLength"
    :rows="rows"
    :type="typeInput"
    :placeholder="metadata.help"
    @blur="validateInput"
    @change="handleChange"
  />
</template>

<script>
export default {
  name: 'TextBase',
  props: {
    metadata: {
      type: Object,
      required: true
    },
    pattern: {
      type: String,
      default: undefined
    },
    typeInput: {
      type: String,
      default: 'text'
    },
    validateInput: {
      type: Function,
      default: () => undefined
    },
    valueModel: {
      type: [String, Number],
      default: undefined
    },
    rows: {
      type: Number,
      default: 5
    }
  },
  data() {
    return {
      value: String(this.metadata.value),
      isReadOnly: false,
      patternFileName: '[A-Za-zñÑ0-9-_]{1,}',
      patternFilePath: '[A-Za-zñÑ0-9-_/.]{1,}'
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
      this.value = String(this.valueModel)
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
    },
    validateUrl(e) {
      // Entry pattern, in this case only accepts numbers and letters
      var _Pattern = /^(http[s]?:\/\/(www\.)?|ftp:\/\/(www\.)?|www\.){1}([0-9A-Za-z-\.@:%_\+~#=]+)+((\.[a-zA-Z]{1,5})+)(\/(.)*)?(\?(.)*)?/g
      var rex = RegExp(_Pattern)
      var value = e.target.value
      if (rex.test(value) && value.trim() !== '') {
        console.log('url good format')
      } else if (value.trim() === '') {
        console.log('url empty')
      } else {
        // e.target.focus()
        console.log('url wrong')
      }
    }
  }
}
</script>
