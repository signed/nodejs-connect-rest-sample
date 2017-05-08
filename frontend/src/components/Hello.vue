<template>
  <div class="hello">
    <template v-if="!currentRelease">
      <a href="javascript:" v-on:click="startRelease">Start a new release right now?</a>
    </template>
    <template v-else>
      <div>
        <a href="javascript:" v-on:click="cancelRelease">cancel release</a>
        <a href="javascript:" v-on:click="updateRelease">store release</a>
      </div>
      <label>version</label>
      <input v-model="currentRelease.version" placeholder="version">
    </template>
  </div>
</template>

<script>
  export default {
    name: 'hello',
    created: function () {
      this.getCurrentRelease()
    },
    data () {
      return {
        flup: 'doom',
        msg: 'Welcome tdfo My oh my sfsdf Vue.afafasfdjs  App',
        question: 'The Question',
        answer: 'You have to ask me',
        response: undefined,
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
          .catch(e => console.log('failed to start a new release ' + e))
      },
      getCurrentRelease: function () {
        const vm = this
        this.$http.get('http://localhost:3000/releases/current')
          .then(response => {
            vm.currentRelease = response.body
          })
          .catch(e => {
            if (e.status !== 404) {
              console.log('failed to fetch current release ' + JSON.stringify(e))
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
          .catch(e => console.log('failed to cancel release ' + JSON.stringify(e)))
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  h1, h2 {
    font-weight: normal;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    display: inline-block;
    margin: 0 10px;
  }

  a {
    color: #42b983;
  }
</style>
