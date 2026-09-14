import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppSelect from './AppSelect.vue'

const options = [
  { value: 'UAT W01 Supplier 20260913', label: 'UAT W01 Supplier 20260913' },
  { value: 'محمد عيد', label: 'محمد عيد' },
]

describe('AppSelect', () => {
  it('renders one readable label per option', () => {
    const wrapper = mount(AppSelect, { props: { modelValue: '', options, placeholder: 'اختر المورد' } })
    const texts = wrapper.findAll('option').map((option) => option.text())

    expect(texts).toEqual(['اختر المورد', 'UAT W01 Supplier 20260913', 'محمد عيد'])
    expect(texts.every((text) => text.trim().length > 0)).toBe(true)
  })

  it('keeps the placeholder as the empty value', () => {
    const wrapper = mount(AppSelect, { props: { modelValue: '', options, placeholder: 'اختر المورد' } })

    expect(wrapper.findAll('option')[0].attributes('value')).toBe('')
  })

  it('marks a supplier the server disabled as unselectable', () => {
    const wrapper = mount(AppSelect, {
      props: { modelValue: '', options: [{ value: 'x', label: 'Disabled Supplier', disabled: true }] },
    })

    expect(wrapper.findAll('option')[0].attributes('disabled')).toBeDefined()
  })

  it('emits the chosen value', async () => {
    const wrapper = mount(AppSelect, { props: { modelValue: '', options } })

    await wrapper.find('select').setValue('محمد عيد')

    expect(wrapper.emitted('update:modelValue')).toEqual([['محمد عيد']])
  })
})
