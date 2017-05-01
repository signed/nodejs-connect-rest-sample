<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    {{flup}}
    {{juhu}}
    <button type="button" v-on:click="fetchData">Click Me!</button>
    <span>{{resolvedResponse}}</span>
    <p>
      Ask a yes/no question:
      <input v-model="question">
    </p>
    <p>{{ answer }}</p>
  </div>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: 'hello',
    data () {
      return {
        flup: 'doom',
        msg: 'Welcome tdfo My oh my sfsdf Vue.afafasfdjs  App',
        question: 'The Question',
        answer: 'You have to ask me',
        response: undefined
      }
    },
    computed: {
      juhu: function () {
        return '< ' + this.flup + ' >'
      },
      resolvedResponse: function () {
        return this.response || 'absent'
      }
    },
    watch: {
      // whenever question changes, this function will run
      question: function (newQuestion) {
        this.answer = 'Waiting for you to stop typing...'
        this.getAnswer()
      }
    },
    methods: {
      getAnswer: _.debounce(function () {
        const vm = this
        vm.answer = 'here you go ' + new Date()
      }, 500),
      fetchData: function () {
        console.log('called')
        const vm = this
        this.$http.get('http://localhost:3000/releases/current')
          .then(response => {
            vm.response = response.body.version
          })
          .catch(error => console.log('nope' + error))
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
