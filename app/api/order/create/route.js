import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = auth(request)
        const { address, items } = await request.json()

        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: "Dữ liệu không hợp lệ" })
        }

        const amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product)

            return acc + product.offerPrice * item.quantity
        }, 0)

        await inngest.send({
            name: 'order/created',
            data: {
                userId,
                address,
                items,
                amount: amount + Math.floor(amount * 0.02),
                date: Date.now()
            }
        })

        //clear cart
        const user = await User.findById(userId)
        User.cartItems = {}
        await user.save()

        return NextResponse.json({ success: true, message: 'Đơn hàng đã đặt' })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, message: error.message })
    }
}