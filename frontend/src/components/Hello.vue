<template>
  <div class="hello">
    <template v-if="!currentRelease">
      <a href="javascript:" v-on:click="startRelease">Start a new release right now?</a>
    </template>
    <template v-else>
      <div>
        <button v-on:click="cancelRelease">cancel release</button>
        <button v-on:click="updateRelease">store release</button>
      </div>
      <label>version</label>
      <input v-model="currentRelease.version" placeholder="version">
      <ol>
        <li v-for="item in currentRelease.items" :key="item.name">
          <a :href="item.link" target="_blank">{{item.name}}</a>
          <textarea v-model="item.text" placeholder="release note"></textarea>
        </li>
      </ol>
    </template>
    <jira></jira>
  </div>
</template>

<script>
  import Jira from './Jira'
  export default {
    components: {Jira},
    name: 'hello',
    created: function () {
      this.getCurrentRelease()
    },
    data () {
      return {
        currentRelease: undefined
      }
    },
    methods: {
      startRelease: function () {
        const vm = this
        this.$http.post('http://localhost:3000/releases/current', {})
          .then(response => {
            vm.currentRelease = response.body
          })
          .catch(e => console.log('failed to start a new release' + e))
      },
      getCurrentRelease: function () {
        const vm = this
        this.$http.get('http://localhost:3000/releases/current')
          .then(response => {
            vm.currentRelease = response.body
          })
          .catch(e => {
            if (e.status !== 404) {
              console.log('failed to fetch current release' + JSON.stringify(e))
            }
          })
      },
      updateRelease: function () {
        this.$http.put('http://localhost:3000/releases/current', this.currentRelease).catch(e => 'failed to store release')
      },
      cancelRelease: function () {
        const vm = this
        this.$http.delete('http://localhost:3000/releases/current')
          .then(() => {
            vm.currentRelease = undefined
          })
          .catch(e => console.log('failed to cancel release' + JSON.stringify(e)))
      }
    }
  }
</script>

<style scoped>
  ol {
    list-style-type: none;
  }
</style>
