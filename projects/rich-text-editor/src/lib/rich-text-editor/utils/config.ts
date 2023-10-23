enum MarkTypes {
  bold = 'bold',
  italic = 'italic',
  underline = 'underline',
  strike = 'strikeThrough',
  code = 'code-line'
}


export const TOOLBAR_ITEMS = [
  {
    action: 'bold',
    icon: '<strong>B</strong>',
  },
  {
    action: 'italic',
    icon: '<i>I</i>',
  },
  {
    action: 'underline',
    icon: '<u>U</u>'
  },
  {
    action: 'code',
    icon: '<code>C</code>',
  },
  {
    action: 'heading1',
    icon: 'H1',
  },
  {
    action: 'heading2',
    icon: 'H2',
  },
  {
    action: 'quote',
    icon: 'Q',
  },
  {
    action: 'numbered-list',
    icon: 'OL',
  },
  {
    action: 'ordered-list',
    icon: 'UL',
  },
  {
    action: 'image',
    icon: 'Img',
  },
  {
    action: 'component',
    icon: 'Com',
  }
];