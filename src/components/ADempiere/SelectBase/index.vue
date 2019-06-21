<template>
  <el-select
    v-model="value"
    :filterable="true"
    :placeholder="metadata.help"
    :loading="loading"
    value-key="key"
    @change="handleChange"
    @visible-change="getDataLookupList"
  >
    <el-option
      v-for="(item, key) in options"
      :key="key"
      :label="item.label"
      :value="item.key"
    />
  </el-select>
</template>

<script>
import { parseContext } from '@/utils/ADempiere'

export default {
  name: 'SelectBase',
  props: {
    metadata: {
      type: Object,
      required: true
    },
    valueModel: {
      type: [Array, String, Number],
      default: () => ([])
    }
  },
  data() {
    return {
      value: this.metadata.value,
      loading: false,
      options: [],
      list: [],
      showControls: true,
      blanckOption: {
        label: '',
        value: -1
      }
    }
  },
  computed: {
    getterOptions() {
      var lookupList = this.$store.getters.getLookupList({
        parsedQuery: this.parsedQuery,
        tableName: this.metadata.reference.tableName
      })
      return lookupList
    },
    parsedQuery() {
      return this.parseContext({
        parentUuid: this.metadata.parentUuid,
        containerUuid: this.metadata.containerUuid,
        value: this.metadata.reference.query
      })
    },
    parsedDirectQuery() {
      return this.parseContext({
        parentUuid: this.metadata.parentUuid,
        containerUuid: this.metadata.containerUuid,
        value: this.metadata.reference.directQuery
      })
    }
  },
  watch: {
    // valueModel() {
    //   this.value = this.valueModel
    // },
    'metadata.isShowedFromUser'(value) {
      if (value) {
        this.getData()
      }
    }
  },
  created() {
    this.options = this.getterOptions
  },
  beforeMount() {
    if (this.metadata.defaultValue === -1 || this.metadata.defaultValue === '-1') {
      this.options.push(this.blanckOption)
    }

    // enable to dataTable records
    if (typeof this.metadata.displayColumn !== 'undefined') {
      var key = this.metadata.value
      if (typeof this.valueModel !== 'undefined') {
        key = this.valueModel
      }
      if (typeof this.options.find(option => option.key === key) === 'undefined') {
        this.options.push({
          key: key,
          label: this.metadata.displayColumn
        })
      }
      this.value = key
    }
  },
  methods: {
    parseContext,
    getData() {
      if (this.metadata.value !== '') {
        this.value = this.metadata.value
      }
      this.$store.dispatch('getLookup', {
        tableName: this.metadata.reference.tableName,
        directQuery: this.parsedDirectQuery,
        value: this.value
      })
        .then(response => {
          this.value = response.label
          this.options.push(response)
          this.options.push(this.blanckOption)
        })
        .catch(err => {
          console.warn('DataRecord, Select Base - Error ' + err.code + ': ' + err.message)
        })
    },
    /**
     * @param {boolean} show triggers when the pull-down menu appears or disappears
     */
    getDataLookupList(showList) {
      if (showList) {
        if (this.getterOptions.length > 0) {
          this.options = this.getterOptions
        } else {
          this.remoteMethod()
        }
      }
    },
    handleChange() {
      if (this.metadata.inTable) {
        var selected = this.options.find(option => option.key === this.value)
        this.$store.dispatch('notifyCellTableChange', {
          parentUuid: this.metadata.parentUuid,
          containerUuid: this.metadata.containerUuid,
          columnName: this.metadata.columnName,
          newValue: this.value,
          keyColumn: this.metadata.keyColumn,
          tableIndex: this.metadata.tableIndex,
          rowKey: this.metadata.rowKey,
          displayColumn: selected.label
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
    remoteMethod() {
      this.loading = true
      this.$store.dispatch('getLookupList', {
        tableName: this.metadata.reference.tableName,
        query: this.parsedQuery
      })
        .then(response => {
          this.loading = false
          this.options = response
          this.options.unshift(this.blanckOption)
        })
        .catch(err => {
          this.loading = false
          console.warn('DataRecord List, Select Base - Error ' + err.code + ': ' + err.message)
        })
    }
  }
}
</script>

<style>
  .el-select {
    width: 100%;
  }
</style>
