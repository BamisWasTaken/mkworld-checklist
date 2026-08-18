import { ComponentFixture } from '@angular/core/testing';

export function dispatchMouse(
  target: EventTarget,
  type: 'mousedown' | 'mousemove' | 'mouseup' | 'click',
  clientX = 0,
  clientY = 0
): MouseEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
  });
  target.dispatchEvent(event);
  return event;
}

export function dispatchTouch(
  target: EventTarget,
  type: 'touchstart' | 'touchmove' | 'touchend',
  clientX = 0,
  clientY = 0
): Event {
  const event = createTouchEvent(type, target, clientX, clientY);
  target.dispatchEvent(event);
  return event;
}

export function swipeMouse(
  fixture: ComponentFixture<unknown>,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): void {
  fixture.debugElement.triggerEventHandler(
    'mousedown',
    new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: fromX, clientY: fromY })
  );
  fixture.debugElement.triggerEventHandler(
    'mousemove',
    new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: toX, clientY: toY })
  );
  fixture.debugElement.triggerEventHandler('mouseup', new MouseEvent('mouseup', { bubbles: true }));
}

export function swipeTouch(
  fixture: ComponentFixture<unknown>,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): void {
  const host = fixture.nativeElement as EventTarget;
  fixture.debugElement.triggerEventHandler(
    'touchstart',
    createTouchEvent('touchstart', host, fromX, fromY)
  );
  fixture.debugElement.triggerEventHandler(
    'touchmove',
    createTouchEvent('touchmove', host, toX, toY)
  );
  fixture.debugElement.triggerEventHandler(
    'touchend',
    createTouchEvent('touchend', host, toX, toY)
  );
}

function createTouchEvent(
  type: 'touchstart' | 'touchmove' | 'touchend',
  target: EventTarget,
  clientX: number,
  clientY: number
): Event {
  const touch = {
    identifier: 0,
    target,
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
    pageX: clientX,
    pageY: clientY,
  };

  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    touches: { value: type === 'touchend' ? [] : [touch] },
    changedTouches: { value: [touch] },
    targetTouches: { value: type === 'touchend' ? [] : [touch] },
  });
  return event;
}
