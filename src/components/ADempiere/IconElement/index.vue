<template>
  <div :class="{'show-input-seacrh':showSearch}" class="search-detail">
    <i
      :class="icon + ' search-icon'"
      @click.stop="click"
      @submit.prevent.native="false"
    />
    <slot
      ref="headerSearchInput"
    />
  </div>
</template>

<script>
export default {
  name: 'IconElement',
  props: {
    icon: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      showSearch: false // show input from search,
    }
  },
  watch: {
    showSearch(value) {
      if (value) {
        document.body.addEventListener('click', this.close)
      } else {
        document.body.removeEventListener('click', this.close)
      }
    }
  },
  methods: {
    click() {
      this.showSearch = !this.showSearch
      if (this.showSearch) {
        this.$refs.headerSearchSelect && this.$refs.headerSearchSelect.focus()
      }
    },
    close() {
      this.$refs.headerSearchSelect && this.$refs.headerSearchSelect.blur()
      this.options = []
      this.show = false
    }
  }
}
</script>

<style lang="scss">
  .search-detail {
    font-size: 0 !important;
    width: 98%;
    .search-icon {
      cursor: pointer;
      font-size: 18px;
      color: #000;
      // position: absolute;
      vertical-align: middle;
    }

    .header-search-input {
      font-size: 12px;
      transition: width 0.2s;
      width: 0;
      overflow: hidden;
      background: transparent;
      border-radius: 0;
      display: inline-block;
      vertical-align: middle;

      /deep/ .el-input__inner {
        border-radius: 0;
        border: 0;
        padding-left: 0;
        padding-right: 0;
        box-shadow: none !important;
        border-bottom: 1px solid #d9d9d9;
        vertical-align: middle;
      }
    }
    &.show-input-seacrh {
      .header-search-input {
        width: 250px;
        margin-left: 5px; // separation with the icon
      }
    }
  }
</style>
