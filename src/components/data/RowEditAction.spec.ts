import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RowEditAction from './RowEditAction.vue'

describe('RowEditAction', () => {
  it('offers an edit affordance for a row the operator may change', () => {
    const wrapper = mount(RowEditAction, { props: { editable: true, label: 'تحرير التوريدة' } })
    const button = wrapper.find('button')

    expect(button.exists()).toBe(true)
    expect(button.attributes('title')).toBe('تحرير التوريدة')
    expect(button.attributes('aria-label')).toBe('تحرير التوريدة')
  })

  it('hides itself for a row the server would refuse', () => {
    // Submitted/cancelled documents are not editable; the page passes docstatus === 0.
    expect(mount(RowEditAction, { props: { editable: false } }).find('button').exists()).toBe(false)
  })

  it('shows itself by default, so master data rows get an action too', () => {
    expect(mount(RowEditAction).find('button').exists()).toBe(true)
  })

  it('emits one edit event per click', async () => {
    const wrapper = mount(RowEditAction, { props: { editable: true } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('edit')).toHaveLength(1)
  })
})
