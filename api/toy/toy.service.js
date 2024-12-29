import { ObjectId } from 'mongodb'

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'

export const toyService = {
    remove,
    query,
    getById,
    add,
    update,
    addToyMsg,
    removeToyMsg,
}

async function query(filterBy = { txt: '' }) {
    try {
        const criteria = {}

        if (filterBy.txt) {
            criteria.name = { $regex: filterBy.txt, $options: 'i' }
        }

        if (filterBy.price) {
            criteria.price = { $lte: filterBy.price }
        }

        if (filterBy.createdAt) {
            criteria.createdAt = { $gte: filterBy.createdAt }
        }

        if (filterBy.isInStock !== undefined && filterBy.isInStock !== '') {
            const isInStockBoolean = filterBy.isInStock === 'true'
            criteria.inStock = isInStockBoolean
        }

        if (filterBy.labels && filterBy.labels.length) {
            criteria.labels = { $all: filterBy.labels }
        }

        const sortOptions = {}
        const { sortBy } = filterBy
        if (sortBy && sortBy.type) {
            const sortDir = +sortBy.desc || 1
            if (sortBy.type === 'txt') {
                sortOptions.name = sortDir
            } else {
                sortOptions[sortBy.type] = sortDir
            }
        }

        const { pageIdx } = filterBy
        const PAGE_SIZE = 14
        const skip = pageIdx !== undefined ? +pageIdx * PAGE_SIZE : 0
        const limit = PAGE_SIZE

        const collection = await dbService.getCollection('toy')
        const toys = await collection
            .find(criteria)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .toArray()

        return toys
    } catch (err) {
        logger.error('cannot find toys', err)
        throw err
    }
}


async function getById(toyId) {
    console.log(toyId)
    console.log('hi')
    try {
        const collection = await dbService.getCollection('toy')
        const toy = await collection.findOne({ _id: ObjectId.createFromHexString(toyId) })
        toy.createdAt = toy._id.getTimestamp()
        return toy
    } catch (err) {
        logger.error(`while finding toy ${toyId}`, err)
        throw err
    }
}

async function remove(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        const { deletedCount } = await collection.deleteOne({ _id: ObjectId.createFromHexString(toyId) })
        return deletedCount
    } catch (err) {
        logger.error(`cannot remove toy ${toyId}`, err)
        throw err
    }
}

async function add(toy) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.insertOne(toy)
        return toy
    } catch (err) {
        logger.error('cannot insert toy', err)
        throw err
    }
}

async function update(toy) {
    try {
        const toyToSave = {
            name: toy.name,
            price: toy.price,
        }
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: ObjectId.createFromHexString(toy._id) }, { $set: toyToSave })
        return toy
    } catch (err) {
        logger.error(`cannot update toy ${toy._id}`, err)
        throw err
    }
}

async function addToyMsg(toyId, msg) {
    try {
        msg.id = utilService.makeId()
        console.log(msg)
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $push: { msgs: msg } })
        return msg
    } catch (err) {
        logger.error(`cannot add toy msg ${toyId}`, err)
        throw err
    }
}

async function removeToyMsg(toyId, msgId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $pull: { msgs: { id: msgId } } })
        return msgId
    } catch (err) {
        logger.error(`cannot add toy msg ${toyId}`, err)
        throw err
    }
}