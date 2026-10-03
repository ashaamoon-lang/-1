import { describe, expect, it } from 'bun:test'

import { enquiryHref } from './enquiry'

describe('enquiryHref', () => {
  it('encodes the subject and keeps the brief on its own lines', () => {
    const href = enquiryHref(
      'studio@arth.example',
      'Enquiry: an engagement like Arus & Balik',
      'Hello,\n\nOrganisation:\nTimeline:'
    )

    expect(href).toBe(
      'mailto:studio@arth.example?subject=Enquiry%3A%20an%20engagement%20like%20Arus%20%26%20Balik&body=Hello%2C%0A%0AOrganisation%3A%0ATimeline%3A'
    )
  })
})
