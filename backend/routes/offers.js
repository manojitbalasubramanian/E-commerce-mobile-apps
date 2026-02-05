const express = require('express')
const Offer = require('../models/Offer')
const Product = require('../models/Product')
const User = require('../models/User')
const { verifyToken } = require('../middleware/auth')

const router = express.Router()

// List offers
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Only admins can list offers' })

    const offers = await Offer.find().sort({ createdAt: -1 })
    res.json(offers)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Create offer
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Only admins can create offers' })

    const { name, discountPercent, startDate, endDate, active } = req.body
    if (!name || discountPercent === undefined) return res.status(400).json({ error: 'Name and discountPercent are required' })
    const dp = Number(discountPercent)
    if (isNaN(dp) || dp < 0 || dp > 100) return res.status(400).json({ error: 'Invalid discountPercent' })

    const offer = new Offer({ name, discountPercent: dp, startDate, endDate, active: !!active, createdBy: req.userId })
    await offer.save()
    res.status(201).json(offer)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Update offer
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Only admins can update offers' })

    const updates = (({ name, discountPercent, startDate, endDate, active }) => ({ name, discountPercent, startDate, endDate, active }))(req.body)
    if (updates.discountPercent !== undefined) {
      const dp = Number(updates.discountPercent)
      if (isNaN(dp) || dp < 0 || dp > 100) return res.status(400).json({ error: 'Invalid discountPercent' })
      updates.discountPercent = dp
    }

    const offer = await Offer.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!offer) return res.status(404).json({ error: 'Offer not found' })

    res.json(offer)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Apply offer to all products
router.post('/:id/apply', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Only admins can apply offers' })

    const offer = await Offer.findById(req.params.id)
    if (!offer) return res.status(404).json({ error: 'Offer not found' })

    // Ensure offer is active server-side
    offer.active = true
    await offer.save()

    // Prepare appliedOffer snapshot
    const appliedOffer = {
      offerId: offer._id,
      name: offer.name,
      discountPercent: offer.discountPercent,
      startDate: offer.startDate,
      endDate: offer.endDate,
      active: true
    }

    // Remove any existing instance and then add to all products to avoid duplicates
    await Product.updateMany({}, { $pull: { appliedOffers: { offerId: offer._id } } })
    const result = await Product.updateMany({}, { $push: { appliedOffers: appliedOffer } })
    res.json({ message: 'Offer applied to all products', modifiedCount: result.modifiedCount })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Stop offer (mark inactive on offer and products where applied)
router.post('/:id/stop', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Only admins can stop offers' })

    const offer = await Offer.findById(req.params.id)
    if (!offer) return res.status(404).json({ error: 'Offer not found' })

    offer.active = false
    await offer.save()

    // Mark appliedOffers.active=false on products that have this offerId
    const result = await Product.updateMany(
      { 'appliedOffers.offerId': offer._id },
      { $set: { 'appliedOffers.$[elem].active': false } },
      { arrayFilters: [{ 'elem.offerId': offer._id }] }
    )

    res.json({ message: 'Offer stopped', modifiedCount: result.modifiedCount })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
