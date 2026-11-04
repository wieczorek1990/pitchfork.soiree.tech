class Settings
  # Animations
  ANIMATION_TIME: 128
  # Frequencies
  LOWEST_FREQUENCY: 110
  HIGHEST_FREQUENCY: 880
  # Audio
  PLAYING_TIME: 1024
  GAIN: 0.1
  # Interstitial
  INTERSTITIAL_SHOW_TIME: 800
  INTERSTITIAL_FADE_TIME: 300


class Game
  constructor: (@settings) ->

  firstFrequency: 0
  secondFrequency: 0
  currentPlayer: null
  isRoundStarting: false

  _getFrequencySpan: (frequency) ->
    low = @settings.LOWEST_FREQUENCY
    base = low
    loop
      if base <= frequency and frequency < 2 * base
        break
      else
        base *= 2
    high = base
    [low, high]

  _rand: (minimum, maximum) ->
    Math.floor(Math.random() * (maximum - minimum + 1)) + minimum

  generateTones: ->
    @firstFrequency = @_rand(@settings.LOWEST_FREQUENCY, @settings.HIGHEST_FREQUENCY)
    @secondFrequency = @_rand(@settings.LOWEST_FREQUENCY, @settings.HIGHEST_FREQUENCY)


class Audio
  constructor: (@settings) ->

  context: null
  oscillator: null

  init: ->
    audioContext = window.AudioContext || window.webkitAudioContext || false
    if audioContext
      @context = new audioContext()
      return @context.resume()
    else
      console.error 'Nor window.AudioContext, nor window.webkitAudioContext is supported. Cannot continue.'

  _getOscillator: (frequency) ->
    oscillator = @context.createOscillator()
    gain = @context.createGain()
    gain.gain.value = @settings.GAIN
    oscillator.connect(gain)
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, @context.currentTime)
    oscillator.connect(@context.destination)
    oscillator

  play: (frequency, name) ->
    if @oscillator?
      @oscillator.stop()
    @oscillator = @_getOscillator(frequency)
    @oscillator.start()
    @currentPlayer = name

  stop: ->
    @oscillator?.stop()


class UI
  constructor: (@settings, @game, @audio) ->
    @onRoundComplete = ->
    @onStart = ->

  # Repeat
  $first: null
  $second: null
  # Choices
  $lower: null
  $equal: null
  $higher: null
  # Interstitials
  $correctInterstitial: null
  $failureInterstitial: null
  # Start button
  $startButton: null
  $startOverlay: null
  # Game content
  $gameContent: null
  # Frequency labels
  $firstFrequency: null
  $secondFrequency: null

  setupUI: ->
    @$first = $ '#first'
    @$second = $ '#second'
    @$lower = $ '#lower'
    @$equal = $ '#equal'
    @$higher = $ '#higher'
    @$correctInterstitial = $ '#correct-interstitial'
    @$failureInterstitial = $ '#failure-interstitial'
    @$startButton = $ '#start-button'
    @$startOverlay = $ '#start-overlay'
    @$gameContent = $ '#game-content'
    @$firstFrequency = $ '#first-frequency'
    @$secondFrequency = $ '#second-frequency'

  updateFrequencyDisplay: ->
    @$firstFrequency.text(@game.firstFrequency + ' Hz')
    @$secondFrequency.text(@game.secondFrequency + ' Hz')

  setupKeyBindings: ->
    Mousetrap.bind 'left', =>
      @$first.click()
    Mousetrap.bind 'right', =>
      @$second.click()
    Mousetrap.bind 'down', =>
      @$lower.click()
    Mousetrap.bind 'space', =>
      @$equal.click()
    Mousetrap.bind 'up', =>
      @$higher.click()

  setupClicks: =>
    @$first.click =>
      @check(@$first[0], @game.firstFrequency, 'first')
    @$second.click =>
      @check(@$second[0], @game.secondFrequency, 'second')
    @$lower.click =>
      @answer(@$lower[0], 'lower')
    @$equal.click =>
      @answer(@$equal[0], 'equal')
    @$higher.click =>
      @answer(@$higher[0], 'higher')
    @$startButton.click =>
      @hideStartOverlay(@onStart)

  hideStartOverlay: (callback) ->
    @$gameContent.removeClass('game-hidden')
    @$startOverlay.addClass('start-overlay-hidden')
    if callback?
      callback()

  animate: ($element) ->
    $element.animate
      'width': '-=16px'
      'height': '-=16px'
      'margin-top': '+=8px'
      'margin-left': '+=8px'
    , @settings.ANIMATION_TIME, 'swing', =>
      $element.animate
        'width': '+=16px'
        'height': '+=16px'
        'margin-top': '-=8px'
        'margin-left': '-=8px'
      , @settings.ANIMATION_TIME

  check: (self, frequency, name) ->
    unless @game.isRoundStarting
      @animate($(self))
      @audio.play(frequency, name)

  _checkAnswer: (answer, onRoundComplete) ->
    success = switch answer
      when 'lower'
        @game.firstFrequency > @game.secondFrequency
      when 'equal'
        @game.firstFrequency == @game.secondFrequency
      when 'higher'
        @game.firstFrequency < @game.secondFrequency

    $body = $ 'body'
    $advices = $ '.advice'
    if success
      $body.removeClass 'body-inverted'
      $advices.removeClass 'advice-inverted'
      @$correctInterstitial.addClass 'show'
      setTimeout =>
        @$correctInterstitial.addClass 'hide'
        setTimeout =>
          @$correctInterstitial.removeClass 'show hide'
          onRoundComplete()
        , @settings.INTERSTITIAL_FADE_TIME
      , @settings.INTERSTITIAL_SHOW_TIME
    else
      $body.addClass 'body-inverted'
      $advices.addClass 'advice-inverted'
      @$failureInterstitial.addClass 'show'
      setTimeout =>
        @$failureInterstitial.addClass 'hide'
        setTimeout =>
          @$failureInterstitial.removeClass 'show hide'
          onRoundComplete()
        , @settings.INTERSTITIAL_FADE_TIME
      , @settings.INTERSTITIAL_SHOW_TIME

    @audio.stop()
    @game.generateTones()
    success

  answer: (self, name) ->
    unless @game.isRoundStarting
      @animate($(self))
      @_checkAnswer(name, @onRoundComplete)


class App
  constructor: ->
    @settings = new Settings()
    @game = new Game(@settings)
    @audio = new Audio(@settings)
    @ui = new UI(@settings, @game, @audio)
    @ui.onRoundComplete = => @startRound()

  startRound: =>
    @game.generateTones()
    @ui.updateFrequencyDisplay()
    @audio.play(@game.firstFrequency, 'first')
    setTimeout =>
      @audio.play(@game.secondFrequency, 'second')
      setTimeout =>
        @audio.stop()
      , @settings.PLAYING_TIME
    , @settings.PLAYING_TIME

  setup: =>
    @ui.setupUI()
    @ui.setupKeyBindings()
    @ui.setupClicks()

$ ->
  app = new App()
  app.setup()
  app.ui.onStart = =>
    app.audio.init()
    app.startRound()
