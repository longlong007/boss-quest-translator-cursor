Component({
  properties: {
    value: {
      type: String,
      value: 'serious'
    }
  },

  methods: {
    onTap(e) {
      const mode = e.currentTarget.dataset.mode
      if (mode === this.properties.value) return
      this.triggerEvent('change', { mode })
    }
  }
})
