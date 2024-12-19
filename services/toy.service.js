
import fs from 'fs'
import { utilService } from './util.service.js'
import { loggerService } from './logger.service.js'


const PAGE_SIZE = 16
export const toyService = {
    query,
    getById,
    remove,
    save
}

const toys = utilService.readJsonFile('data/toy.json')

function query(filterBy = { txt: '' }) {
    const regex = new RegExp(filterBy.txt, 'i')
    let filteredToys = toys.filter(toy => regex.test(toy.name))

    if (filterBy.price) {
        filteredToys = filteredToys.filter(toy => toy.price <= filterBy.price)
    }
    if (filterBy.createdAt) {
        filteredToys = filteredToys.filter(toy => toy.createdAt >= filterBy.createdAt)
    }

    if (filterBy.isInStock !== undefined && filterBy.isInStock !== '') {
        const isInStockBoolean = filterBy.isInStock === 'true'
        filteredToys = filteredToys.filter(toy => toy.inStock === isInStockBoolean)
    }

    if (filterBy.labels && filterBy.labels.length) {
        filteredToys = filteredToys.filter(toy =>
            filterBy.labels.every(label => toy.labels.includes(label))
        )
    }

    // sort
    const { sortBy } = filterBy
    if (sortBy.type) {
      filteredToys.sort((t1, t2) => {
        const sortDirection = +sortBy.desc
        if (sortBy.type === 'txt') {
          return t1.name.localeCompare(t2.name) * sortDirection
        } else if (sortBy.type === 'price' || sortBy.type === 'createdAt') {
          return (t1[sortBy.type] - t2[sortBy.type]) * sortDirection
        }
      })
    }
    // console.log('filteredToys:', filteredToys)

    const { pageIdx } = filterBy
    if (pageIdx !== undefined) {
        let startIdx = +pageIdx * PAGE_SIZE
        filteredToys = filteredToys.slice(startIdx, startIdx + PAGE_SIZE)
    }

    return Promise.resolve(filteredToys)
}

function getById(toyId) {
    const toy = toys.find(toy => toy._id === toyId)
    return Promise.resolve(toy)
}

function remove(toyId, loggedinUser) {
    const idx = toys.findIndex(toy => toy._id === toyId)
    if (idx === -1) return Promise.reject('No Such Toy')

    const toy = toys[idx]
    if (!loggedinUser.isAdmin &&
        toy.owner._id !== loggedinUser._id) {
        return Promise.reject('Not your toy')
    }
    toys.splice(idx, 1)
    return _saveToysToFile()
}

function save(toy, loggedinUser) {
    if (toy._id) {
        const toyToUpdate = toys.find(currToy => currToy._id === toy._id)
        if (!loggedinUser.isAdmin &&
            toyToUpdate.owner._id !== loggedinUser._id) {
            return Promise.reject('Not your toy')
        }
        toyToUpdate.name = toy.name
        toyToUpdate.updateAt = Date.now()
        toyToUpdate.createdAt = toy.createdAt
        toyToUpdate.price = toy.price
        toyToUpdate.inStock = toy.inStock
        toyToUpdate.labels = toy.inStock
        toy = toyToUpdate
    } else {
        toy._id = utilService.makeId()
        toy.owner = loggedinUser
        toys.unshift(toy)
    }
    delete toy.owner.score
    return _saveToysToFile().then(() => toy)
}


function _saveToysToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(toys, null, 2)
        fs.writeFile('data/toy.json', data, (err) => {
            if (err) {
                loggerService.error('Cannot write to toys file', err)
                return reject(err)
            }
            resolve()
        })
    })
}