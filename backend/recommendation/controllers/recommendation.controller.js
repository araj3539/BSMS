const interactionService = require("../services/interaction.service");

class RecommendationController {

    async track(req, res) {

        try {

            const { bookId, action, metadata } = req.body;

            await interactionService.log({

                userId: req.user.id,

                bookId,

                action,

                metadata

            });

            return res.status(201).json({

                success: true

            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({

                success: false,

                message: err.message

            });

        }

    }

}

module.exports = new RecommendationController();