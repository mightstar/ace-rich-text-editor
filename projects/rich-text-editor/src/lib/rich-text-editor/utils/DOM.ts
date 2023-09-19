
export function isRectEmpty(rect : DOMRect) {

    return rect.x == 0 && rect.y == 0 && rect.right == 0 && rect.bottom == 0 ;
}