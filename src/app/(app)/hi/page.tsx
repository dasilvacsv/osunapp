import React from 'react'
import Dashboard from './component'
import { Component } from './comp'
import { getDashboardData } from './fetch'



export default async function Page() {
    const data = await getDashboardData()


    return (
        <div>Hello
    
    <Component data={data}/>
        </div>
      )
    
}
