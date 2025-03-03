import {prepareRunChecker} from '../../../../libs/shared/utils.js'

const { shouldRun: scrollShouldRun } = prepareRunChecker({timerDelay: 0})
const { shouldRun: clickShouldRun } = prepareRunChecker({timerDelay: 1000})
export default class HandGestureController {
  #view
  #service
  #camera
  #lastDirection = {
    direction: '',
    y: 0
  }
  constructor({view, service, camera}) {
    this.#view = view;
    this.#service = service;

    this.#camera = camera
  }

  async init() {
    return this.#loop()
  }

  #scrollPage(direction){
    const pixelPerScroll = 12;
    
    // if(this.#lastDirection.direction === direction){

      this.#lastDirection.y = (
        direction === 'scroll-down' ?

        this.#lastDirection.y + pixelPerScroll :
        this.#lastDirection.y - pixelPerScroll 
      )

    // } else { this.#lastDirection.direction = direction }

    this.#view.scrollPage(this.#lastDirection.y)
  }

  async #estimateHands() {
    try{ 
      const hands = await this.#service.estimateHands(this.#camera.video);
      
      this.#view.clearCanvas()
      if(hands?.length) this.#view.drawnResult(hands)

      for await (const { event, x, y } of this.#service.detectGesture(hands)){
        if(!scrollShouldRun()) continue;

        console.log({event});

        if(event === 'click') {
          if(!clickShouldRun()) continue;

          this.#view.clickOnElement(x,y)
          continue;
        }

        if(event.includes('scroll')) this.#scrollPage(event)
      }
    }

    catch(error) { console.log("Deu ruim :/", {error}) }
  }
  
  async #loop () {
    await this.#service.initializeDetector()
    await this.#estimateHands()
    this.#view.loop(this.#loop.bind(this))
  }

  static async initialize(deps){
    const controller = new HandGestureController(deps);
    return controller.init()
  }
}